import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import './Session.css';

const Session = ({ teacherId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axiosInstance.get(`/teacherportal/${teacherId}/sessions/today`);
        setSessions(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setLoading(false);
      }
    };

    fetchSessions();
  }, [teacherId]);

  const handleStartSession = (sessionId) => {
    console.log('Start session:', sessionId);
    // Implement start session logic here
  };

  const handleEndSession = (sessionId) => {
    console.log('End session:', sessionId);
    // Implement end session logic here
  };

  const handleUpdateAssignment = (sessionId) => {
    console.log('Update assignment for session:', sessionId);
    // Implement assignment update logic here
  };

  const handleNotifyAssignment = (sessionId) => {
    console.log('Notify for session:', sessionId);
    // Implement notification logic here
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="session-container">
      <h2>Today's Sessions</h2>
      {sessions.length === 0 ? (
        <p>No sessions scheduled for today.</p>
      ) : (
        <table className="session-table">
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
                <td>{session.startTime} - {session.endTime}</td>
                <td>{session.schoolName}</td>
                <td>
                  {session.sessionStarted ? (
                    session.sessionStarted
                  ) : (
                    <button
                      onClick={() => handleStartSession(session.id)}
                      style={{ backgroundColor: '#FFD700', padding: '5px', borderRadius: '5px' }}
                    >
                      Start Session
                    </button>
                  )}
                </td>
                <td>
                  {session.sessionEnded ? (
                    session.sessionEnded
                  ) : (
                    <button
                      onClick={() => handleEndSession(session.id)}
                      style={{ backgroundColor: '#FFD700', padding: '5px', borderRadius: '5px' }}
                    >
                      End Session
                    </button>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleUpdateAssignment(session.id)}
                    style={{ backgroundColor: '#28a745', padding: '5px', borderRadius: '5px', marginRight: '5px' }}
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleNotifyAssignment(session.id)}
                    style={{ backgroundColor: '#6c757d', padding: '5px', borderRadius: '5px' }}
                  >
                    Notify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Session;
