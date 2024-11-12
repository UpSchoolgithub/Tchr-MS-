import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams, useLocation } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { teacherId, sessionId } = useParams();
  const location = useLocation();
  const { classId, subject, school, sectionName, sectionId } = location.state || {}; // Retrieve sectionId for data fetching, sectionName for display
  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [sessionDetails, setSessionDetails] = useState({});

  useEffect(() => {
    if (!sectionId) {
      console.error("sectionId is undefined. Cannot fetch students.");
      return;
    }

    // Fetch students for the section using sectionId
    const fetchStudents = async () => {
      try {
        const response = await axiosInstance.get(`/sections/${sectionId}/students`);
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [sectionId]);

  useEffect(() => {
    if (!sessionId || !teacherId) {
      console.error("sessionId or teacherId is undefined. Cannot fetch session details.");
      return;
    }

    // Fetch session details
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

  const handleMarkAbsent = (studentId) => {
    if (!absentees.includes(studentId)) {
      setAbsentees((prev) => [...prev, studentId]);
    }
  };

  const handleMarkPresent = (studentId) => {
    setAbsentees((prev) => prev.filter((id) => id !== studentId));
  };

  const endSession = async () => {
    if (!sessionId) {
      console.error("sessionId is undefined. Cannot mark attendance.");
      return;
    }

    try {
      const response = await axiosInstance.post(`/teachers/${teacherId}/sessions/${sessionId}/attendance`, {
        date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        absentees,
        sectionId,
        classId,
        subject,
        school,
        section: sectionName // Pass section name for display if needed
      });

      alert("Session ended and attendance marked successfully.");
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Failed to mark attendance.");
    }
  };

  return (
    <div className="session-details-container">
      <h2>Session Details</h2>

      {/* Display session details */}
      <div className="session-info">
        <p><strong>Class ID:</strong> {classId}</p>
        <p><strong>Subject:</strong> {subject}</p>
        <p><strong>School:</strong> {school}</p>
        <p><strong>Section:</strong> {sectionName}</p> {/* Display section name */}
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
        <div className="assignments-dropdown">
          <label>Assignments:</label>
          <select>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        <textarea className="observations-textarea" placeholder="Observations"></textarea>
        <button className="end-session-button" onClick={endSession}>End Session</button>
      </div>
    </div>
  );
};

export default SessionDetails;
