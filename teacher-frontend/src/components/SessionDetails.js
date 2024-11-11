// src/components/SessionDetails.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';

const SessionDetails = () => {
  const location = useLocation();
  const session = location.state?.session;
  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axiosInstance.get(`/sections/${session.sectionId}/students`);
        setStudents(response.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, [session.sectionId]);

  const markAbsent = (studentId) => {
    setAbsentees((prev) => [...prev, studentId]);
  };

  const markPresent = (studentId) => {
    setAbsentees((prev) => prev.filter(id => id !== studentId));
  };

  const handleEndSession = async () => {
    try {
      await axiosInstance.post(`/sessions/${session.id}/attendance`, {
        absentees
      });
      alert('Session attendance recorded successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    }
  };

  return (
    <div className="session-details">
      <div className="attendance-section">
        <h3>Mark Attendance</h3>
        <select multiple onChange={(e) => markAbsent(e.target.value)}>
          {students.map(student => (
            <option key={student.id} value={student.id}>{student.studentName}</option>
          ))}
        </select>
        <div className="absentees-list">
          <h4>List of Absentees:</h4>
          <ul>
            {absentees.map((id, index) => (
              <li key={id}>
                {students.find(student => student.id === id)?.studentName}
                <button onClick={() => markPresent(id)}>Mark Present</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="session-notes">
        <h2>Session Notes and Details</h2>
        <p><strong>Session Number:</strong> {session.sessionNumber}</p>
        <p><strong>Chapter:</strong> {session.chapter}</p>
        <div>
          <label>Assignments:</label>
          <select>
            <option>No</option>
            <option>Yes</option>
          </select>
        </div>
        <textarea placeholder="Observations" />
        <button onClick={handleEndSession}>End Session</button>
      </div>
    </div>
  );
};

export default SessionDetails;
