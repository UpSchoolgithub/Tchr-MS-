import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';

const Session = () => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axiosInstance.get('/teacher/sessions'); // Fetch sessions for the logged-in teacher
        setSessions(response.data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  const handleStartSession = async (sessionId) => {
    try {
      await axiosInstance.post(`/teacher/sessions/${sessionId}/start`);
      // Optionally, update the session state or refetch sessions after starting
      fetchSessions();
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await axiosInstance.post(`/teacher/sessions/${sessionId}/end`);
      // Optionally, update the session state or refetch sessions after ending
      fetchSessions();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleUpdateAssignment = (sessionId) => {
    // Logic for updating the assignment for a session
    console.log('Update assignment for session:', sessionId);
  };

  const handleNotifyAssignment = (sessionId) => {
    // Logic for notifying students about the assignment for a session
    console.log('Notify assignment for session:', sessionId);
  };

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
          {sessions.map((session) => (
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
