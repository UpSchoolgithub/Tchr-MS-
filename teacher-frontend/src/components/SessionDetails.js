import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { teacherId, sectionId, sessionId } = useParams();
  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);

  useEffect(() => {
    console.log("Section ID:", sectionId); // Log to check if sectionId is retrieved

    if (!sectionId) {
      console.error("sectionId is undefined. Cannot fetch students.");
      return;
    }

    // Fetch students for the section
    const fetchStudents = async () => {
      try {
        const response = await axiosInstance.get(`/sections/${sectionId}/students`);
        setStudents(response.data);
        console.log("Fetched students:", response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [sectionId]);
  
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
      // Send the attendance data to the backend
      const response = await axiosInstance.post(`/teachers/${sessionId}/attendance`, {
        date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        absentees,
        sectionId,
      });

      console.log("Attendance marked successfully:", response.data);
      alert("Session ended and attendance marked successfully.");
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Failed to mark attendance.");
    }
  };

  return (
    <div className="session-details-container">
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
        <div className="session-info">
          <label>Session Number:</label> <span>05</span>
        </div>
        <div className="session-info">
          <label>Chapter:</label> <span>Respiration in Plants</span>
        </div>
        <div className="assignments-dropdown">
          <label>Assignments:</label>
          <select>
            <option>No</option>
            <option>Yes</option>
          </select>
        </div>
        <textarea className="observations-textarea" placeholder="Observations"></textarea>
        <button className="end-session-button" onClick={endSession}>End Session</button>
      </div>
    </div>
  );
};

export default SessionDetails;
