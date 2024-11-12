import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams, useLocation } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { teacherId, sessionId } = useParams();
  const location = useLocation();
  const { classId, subject, school, sectionName, sectionId } = location.state || {};
  
  const [students, setStudents] = useState([]); // Student list for this session
  const [absentees, setAbsentees] = useState([]); // Track absentees
  const [sessionDetails, setSessionDetails] = useState({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch students for the section
  const fetchStudentData = async () => {
    try {
      const response = await axiosInstance.get(
        `/schools/${school}/classes/${classId}/sections/${sectionId}/students`
      );
      setStudents(response.data);
      setFeedbackMessage("Students fetched successfully.");
      setIsSuccess(true);
    } catch (error) {
      console.error("Error fetching students:", error);
      setFeedbackMessage("Failed to fetch students.");
      setIsSuccess(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [school, classId, sectionId]);

  // Fetch session details
  useEffect(() => {
    if (!sessionId || !teacherId) {
      console.error("sessionId or teacherId is undefined. Cannot fetch session details.");
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        const response = await axiosInstance.get(`/teachers/${teacherId}/sessions/${sessionId}`);
        setSessionDetails(response.data);
      } catch (error) {
        console.error("Error fetching session details:", error);
      }
    };

    fetchSessionDetails();
  }, [sessionId, teacherId]);

  // Mark a student as absent
  const handleMarkAbsent = (studentId) => {
    if (!absentees.includes(studentId)) {
      setAbsentees((prev) => [...prev, studentId]);
    }
  };

  // Mark a student as present
  const handleMarkPresent = (studentId) => {
    setAbsentees((prev) => prev.filter((id) => id !== studentId));
  };

  // Save attendance for the session
  const saveAttendance = async () => {
    const attendanceData = students.map((student) => ({
      studentId: student.id,
      sectionId,
      date: new Date().toISOString().split('T')[0],
      status: absentees.includes(student.id) ? 'A' : 'P',
    }));

    try {
      await axiosInstance.post(`/schools/${school}/classes/${classId}/sections/${sectionId}/attendance`, {
        attendanceData,
      });
      setAttendanceSaved(true);
      setFeedbackMessage("Attendance saved successfully. You can still edit until the session is ended.");
      setIsSuccess(true);
    } catch (error) {
      console.error("Error saving attendance:", error);
      setFeedbackMessage("Failed to save attendance.");
      setIsSuccess(false);
    }
  };

  // End the session and finalize attendance
  const endSession = async () => {
    if (!attendanceSaved) {
      alert("Please save the attendance before ending the session.");
      return;
    }

    try {
      await axiosInstance.post(`/teachers/${teacherId}/sessions/${sessionId}/finalize-attendance`, {
        sessionId,
        finalized: true,
      });
      alert("Session ended and attendance finalized.");
    } catch (error) {
      console.error("Error finalizing attendance:", error);
      alert("Failed to finalize attendance.");
    }
  };

  return (
    <div className="session-details-container">
      <h2>Session Details</h2>

      <div className="session-info">
        <p><strong>Class ID:</strong> {classId}</p>
        <p><strong>Subject:</strong> {subject}</p>
        <p><strong>School:</strong> {school}</p>
        <p><strong>Section:</strong> {sectionName}</p>
        <p><strong>Section ID:</strong> {sectionId}</p>
        <p><strong>Session Number:</strong> {sessionDetails.sessionNumber || 'N/A'}</p>
        <p><strong>Chapter:</strong> {sessionDetails.chapter || 'N/A'}</p>
      </div>

      {feedbackMessage && <p style={{ color: isSuccess ? 'green' : 'red' }}>{feedbackMessage}</p>}

      <div className="attendance-section">
        <h3>Mark Attendance</h3>
        <select
          className="dropdown"
          onChange={(e) => handleMarkAbsent(parseInt(e.target.value))}
        >
          <option value="">Choose Absentees</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.studentName}
            </option>
          ))}
        </select>

        <div className="absentees-list">
          <h4>List of Absentees:</h4>
          {absentees.length > 0 ? (
            absentees.map((id) => {
              const student = students.find((s) => s.id === id);
              return (
                <div key={id} className="absentee-item">
                  <span>{student?.studentName}</span>
                  <button className="mark-present-button" onClick={() => handleMarkPresent(id)}>
                    Mark Present
                  </button>
                </div>
              );
            })
          ) : (
            <p>No absentees selected.</p>
          )}
        </div>
      </div>

      <div className="session-notes-section">
        <h3>Session Notes and Details</h3>
        <textarea className="observations-textarea" placeholder="Observations"></textarea>
        <button className="save-button" onClick={saveAttendance}>Save Attendance</button>
        <button className="end-session-button" onClick={endSession}>End Session</button>
      </div>
    </div>
  );
};

export default SessionDetails;
