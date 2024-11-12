import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams, useLocation } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { teacherId, sessionId } = useParams();
  const location = useLocation();
  const { classId, subject, school, sectionName, sectionId } = location.state || {};

  const [students, setStudents] = useState([]); // Full list of students
  const [filteredStudents, setFilteredStudents] = useState([]); // Filtered student list for search
  const [absentees, setAbsentees] = useState([]); // List of absentees
  const [sessionDetails, setSessionDetails] = useState({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Search query for filtering students

  useEffect(() => {
    if (!sectionId) {
      console.error("sectionId is undefined. Cannot fetch students.");
      return;
    }

    const fetchStudents = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${school}/classes/${classId}/sections/${sectionId}/students`);
        setStudents(response.data);
        setFilteredStudents(response.data); // Initialize with full list
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [school, classId, sectionId]);

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
        console.error('Error fetching session details:', error);
      }
    };

    fetchSessionDetails();
  }, [sessionId, teacherId]);

  // Filter students based on the search query
  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !absentees.includes(student.id)
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students, absentees]);

  // Mark a student as absent
  const handleMarkAbsent = (studentId) => {
    if (!absentees.includes(studentId)) {
      setAbsentees((prev) => [...prev, studentId]);
    }
  };

  // Remove a student from absentees (mark as present)
  const handleMarkPresent = (studentId) => {
    setAbsentees((prev) => prev.filter((id) => id !== studentId));
  };

  // Save attendance
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
      alert("Attendance saved successfully. You can still edit until the session is ended.");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance.");
    }
  };

  // End session and finalize attendance
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

      <div className="attendance-section">
        <h3>Mark Attendance</h3>
        <input
          type="text"
          placeholder="Search by student name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <div className="student-list">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="student-item"
                onClick={() => handleMarkAbsent(student.id)}
              >
                {student.studentName}
              </div>
            ))
          ) : (
            <p>No students found.</p>
          )}
        </div>

        <div className="absentees-list">
          <h4>List of Absentees:</h4>
          <div className="absentee-tags">
            {absentees.map((id) => {
              const student = students.find((s) => s.id === id);
              return (
                <div key={id} className="absentee-tag">
                  <span>{student?.studentName}</span>
                  <button
                    className="mark-present-button"
                    onClick={() => handleMarkPresent(id)}
                  >
                    ❌
                  </button>
                </div>
              );
            })}
          </div>
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
