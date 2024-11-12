import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams, useLocation } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { teacherId, sessionId } = useParams();
  const location = useLocation();
  const { classId, subject, school, sectionName, sectionId } = location.state || {};
  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [sessionDetails, setSessionDetails] = useState({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // Debugging Logs
  useEffect(() => {
    console.log("Session Details Component Loaded:");
    console.log("teacherId:", teacherId);
    console.log("sessionId:", sessionId);
    console.log("sectionId:", sectionId);
  }, [teacherId, sessionId, sectionId]);

  // Fetch Students
  useEffect(() => {
    if (!sectionId) {
      console.error("sectionId is undefined. Cannot fetch students.");
      return;
    }

    const fetchStudents = async () => {
      console.log("Fetching students for section:", sectionId); // Debugging log
      try {
        const response = await axiosInstance.get(`/sections/${sectionId}/students`);
        console.log("Fetched students:", response.data); // Debugging log
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [sectionId]);

  // Fetch Session Details
  useEffect(() => {
    if (!sessionId || !teacherId) {
      console.error("sessionId or teacherId is undefined. Cannot fetch session details.");
      return;
    }

    const fetchSessionDetails = async () => {
      console.log("Fetching session details for session:", sessionId); // Debugging log
      try {
        const response = await axiosInstance.get(`/teachers/${teacherId}/sessions/${sessionId}`);
        console.log("Fetched session details:", response.data); // Debugging log
        setSessionDetails(response.data);
      } catch (error) {
        console.error('Error fetching session details:', error);
      }
    };

    fetchSessionDetails();
  }, [sessionId, teacherId]);

  const handleMarkAbsent = (studentId) => {
    if (!absentees.includes(studentId)) {
      setAbsentees((prev) => [...prev, studentId]);
    }
  };

  const handleMarkPresent = (studentId) => {
    setAbsentees((prev) => prev.filter((id) => id !== studentId));
  };

  const saveAttendance = async () => {
    const attendanceData = students.map(student => ({
      studentId: student.id,
      sectionId,
      date: new Date().toISOString().split('T')[0],
      status: absentees.includes(student.id) ? 'A' : 'P'
    }));

    try {
      await axiosInstance.post(`/schools/${school}/classes/${classId}/sections/${sectionId}/attendance`, {
        attendanceData
      });
      setAttendanceSaved(true);
      alert("Attendance saved successfully. You can still edit until the session is ended.");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance.");
    }
  };

  const endSession = async () => {
    if (!attendanceSaved) {
      alert("Please save the attendance before ending the session.");
      return;
    }

    try {
      await axiosInstance.post(`/teachers/${teacherId}/sessions/${sessionId}/finalize-attendance`, {
        sessionId,
        finalized: true
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

      <div className="attendance-section">
        <h3>Mark Attendance</h3>
        <select
          className="dropdown"
          onChange={(e) => handleMarkAbsent(parseInt(e.target.value))}
        >
          <option value="">Choose Absentees</option>
          {students.length > 0 ? (
            students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.studentName}
              </option>
            ))
          ) : (
            <option disabled>Loading students...</option>
          )}
        </select>

        <div className="absentees-list">
          <h4>List of Absentees:</h4>
          {absentees.length > 0 ? (
            absentees.map((id) => {
              const student = students.find((s) => s.id === id);
              return (
                <div key={id} className="absentee-item">
                  <span>{student?.studentName}</span>
                  <button
                    className="mark-present-button"
                    onClick={() => handleMarkPresent(id)}
                  >
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
