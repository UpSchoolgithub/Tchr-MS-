import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Session.css';

const Session = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get the current day in a readable format (e.g., 'Monday', 'Tuesday')
  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const fetchSessions = async (date) => {
    const dayName = getDayName(date);

    try {
      const response = await axiosInstance.get('/teacher/sessions', {
        params: { date: date.toISOString().slice(0, 10) }
      });
      // Filter sessions by the current day name
      const filteredSessions = response.data.filter(session => session.day === dayName);
      setSessions(filteredSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  useEffect(() => {
    fetchSessions(selectedDate);
    console.log('Sessions:', sessions); // Log the sessions
  }, [selectedDate]);
  
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

  const handleUpdateAssignment = (sessionId) => {
    console.log('Update assignment for session:', sessionId);
  };

  const handleNotifyAssignment = (sessionId) => {
    console.log('Notify assignment for session:', sessionId);
  };

  return (
    <div>
      <h2>TODAY'S SESSIONS</h2>
      <DatePicker 
        selected={selectedDate} 
        onChange={date => setSelectedDate(date)} 
        dateFormat="yyyy-MM-dd"
      />
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
