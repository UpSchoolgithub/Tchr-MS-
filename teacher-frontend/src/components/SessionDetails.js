import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { teacherId, sectionId, sessionId } = useParams();
  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [sessionDetails, setSessionDetails] = useState({}); // To store session-specific details

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
        console.log("Fetched session details:", response.data);
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
      // Send the attendance data to the backend
      const response = await axiosInstance.post(`/teachers/${teacherId}/sessions/${sessionId}/attendance`, {
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
          <label>Session Number:</label> <span>{sessionDetails.sessionNumber || 'N/A'}</span>
        </div>
        <div className="session-info">
          <label>Chapter:</label> <span>{sessionDetails.chapter || 'N/A'}</span>
        </div>
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
