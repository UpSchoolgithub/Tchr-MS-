import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Session.css';
import { useParams } from 'react-router-dom';

const Session = () => {
  const { teacherId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);

  // Helper function to get the day of the week from a date
  const getDayOfWeek = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const fetchSessionsByDay = async (day) => {
    if (!teacherId) {
      setError('Teacher ID is undefined');
      console.error('Teacher ID is undefined');
      return;
    }

    try {
      console.log(`Fetching sessions for teacherId: ${teacherId} on day: ${day}`);
      const response = await axiosInstance.get(`/teacherportal/${teacherId}/sessions`, {
        params: { day },
      });
      setSessions(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to fetch sessions');
    }
  };

  useEffect(() => {
    const dayOfWeek = getDayOfWeek(selectedDate); // Determine the day based on the selected date
    fetchSessionsByDay(dayOfWeek);
  }, [selectedDate, teacherId]);

  return (
    <div>
      <h2>Today's Sessions</h2>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        dateFormat="yyyy-MM-dd"
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
              <td colSpan="8">No sessions for the selected day.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Session;
