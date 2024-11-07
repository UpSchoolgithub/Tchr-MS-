import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Session.css';
import { useNavigate } from 'react-router-dom';

const Session = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch sessions for the specific day of the week
  const fetchSessions = async (date) => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }); // Get day name, e.g., "Thursday"
    try {
      const response = await axiosInstance.get('/teacher/timetable', { params: { day: dayOfWeek } });
      if (response.data && response.data.length > 0) {
        setSessions(response.data);
        setError('');
      } else {
        setSessions([]);
        setError('No sessions for today');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to fetch sessions');
    }
  };

  useEffect(() => {
    fetchSessions(selectedDate);
  }, [selectedDate]);

  const handleStartSession = (session) => {
    // Navigate to session details page, passing session data as state
    navigate('/session-details', { state: { session } });
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
      {sessions.length > 0 && (
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
                <td>{session.duration}</td>
                <td>{session.schoolName}</td>
                <td>
                  {session.sessionStarted ? (
                    <span>{session.sessionStarted}</span>
                  ) : (
                    <button className="start-button" onClick={() => handleStartSession(session)}>
                      Start Session
                    </button>
                  )}
                </td>
                <td>{session.sessionEnded ? session.sessionEnded : '-'}</td>
                <td>
                  <button className="update-button">Update</button>
                  <button className="notify-button">Notify</button>
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
