import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Session.css';

const Session = () => {
  const { teacherId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);

  const getDayOfWeek = (date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'long' });
  };

  const fetchSessions = async (date) => {
    const dayOfWeek = getDayOfWeek(date);
    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/timetable`, {
        params: { day: dayOfWeek }
      });
      setSessions(response.data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to fetch sessions");
    }
  };

  useEffect(() => {
    fetchSessions(selectedDate);
  }, [selectedDate, teacherId]);

  const handleStartSession = async (sessionId) => {
    try {
      await axiosInstance.post(`/teacher/sessions/${sessionId}/start`);
      fetchSessions(selectedDate);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await axiosInstance.post(`/teacher/sessions/${sessionId}/end`);
      fetchSessions(selectedDate);
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
      {error && <p className="error">{error}</p>}
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
          {sessions.length === 0 ? (
            <tr>
              <td colSpan="8">No sessions for today.</td>
            </tr>
          ) : (
            sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.className}</td>
                <td>{session.section}</td>
                <td>{session.subject}</td>
                <td>{session.duration}</td>
                <td>{session.schoolName}</td>
                <td>{session.sessionStarted || 'Not Started'}</td>
                <td>{session.sessionEnded || 'Not Ended'}</td>
                <td>
                  {!session.sessionStarted ? (
                    <button onClick={() => handleStartSession(session.id)}>Start Session</button>
                  ) : !session.sessionEnded ? (
                    <button onClick={() => handleEndSession(session.id)}>End Session</button>
                  ) : (
                    <span>Session Ended</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Session;
