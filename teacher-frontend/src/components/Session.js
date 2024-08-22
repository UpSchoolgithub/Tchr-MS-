import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';

const Session = () => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axiosInstance.get('/api/teacher/sessions');
        console.log('Fetched sessions:', response.data); // Log the data
        setSessions(response.data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  if (sessions.length === 0) {
    return <div>No sessions available.</div>; // Show message if no data
  }

  return (
    <div>
      <h2>TODAY'S SESSIONS</h2>
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Section</th>
            <th>Subject</th>
            <th>Duration</th>
            <th>School</th>
            <th>Session Started</th>
            <th>Session Ended</th>
            <th>Assignments</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id}>
              <td>{session.className}</td>
              <td>{session.section}</td>
              <td>{session.subject}</td>
              <td>{session.duration}</td>
              <td>{session.schoolName}</td>
              <td>
                <button onClick={() => handleStartSession(session.id)}>Start Session</button>
              </td>
              <td>
                <button onClick={() => handleEndSession(session.id)}>End Session</button>
              </td>
              <td>
                <button onClick={() => handleUpdateAssignment(session.id)}>Update</button>
                <button onClick={() => handleNotifyAssignment(session.id)}>Notify</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Session;
