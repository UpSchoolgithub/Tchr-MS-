import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Session.css';
import { useParams } from 'react-router-dom';

const Session = () => {
  const { teacherId } = useParams(); // Assuming teacherId is in the URL params
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);

  const fetchSessionsByDay = async (day) => {
    try {
      const response = await axiosInstance.get(`/teacherportal/${teacherId}/sessions`, {
        params: { day: day }
      });
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to fetch sessions');
    }
  };

  useEffect(() => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    fetchSessionsByDay(dayOfWeek);
  }, [selectedDate, teacherId]);

  const handleStartSession = async (sessionId) => {
    try {
      await axiosInstance.post(`/teacherportal/sessions/${sessionId}/start`);
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      fetchSessionsByDay(dayOfWeek); // Refresh sessions after starting
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await axiosInstance.post(`/teacherportal/sessions/${sessionId}/end`);
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      fetchSessionsByDay(dayOfWeek); // Refresh sessions after ending
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  return (
    <div>
      <h2>Today's Sessions</h2>
      <DatePicker 
        selected={selectedDate} 
        onChange={date => setSelectedDate(date)} 
        dateFormat="yyyy-MM-dd"
      />
      {error && <p>{error}</p>}
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.className}</td>
                <td>{session.section}</td>
                <td>{session.subject}</td>
                <td>{session.duration}</td>
                <td>{session.schoolName}</td>
                <td>
                  {session.sessionStarted ? session.sessionStarted : (
                    <button onClick={() => handleStartSession(session.id)}>Start Session</button>
                  )}
                </td>
                <td>
                  {session.sessionEnded ? session.sessionEnded : (
                    <button onClick={() => handleEndSession(session.id)}>End Session</button>
                  )}
                </td>
                <td>
                  <button onClick={() => console.log('Update')}>Update</button>
                  <button onClick={() => console.log('Notify')}>Notify</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">No sessions for today.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Session;
