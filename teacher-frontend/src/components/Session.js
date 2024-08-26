import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Session.css'; // Assuming you have a CSS file for styles

const Session = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); // State to store the selected date

  const fetchSessions = async (date) => {
    try {
      const response = await axiosInstance.get('/teacher/sessions', {
        params: { date: date.toISOString().slice(0, 10) } // Send the date in YYYY-MM-DD format
      });
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  useEffect(() => {
    fetchSessions(selectedDate); // Fetch sessions for the selected date
  }, [selectedDate]); // Re-fetch sessions whenever the selected date changes

  const handleStartSession = async (sessionId) => {
    try {
      await axiosInstance.post(`/teacher/sessions/${sessionId}/start`);
      fetchSessions(selectedDate); // Refresh sessions after starting one
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await axiosInstance.post(`/teacher/sessions/${sessionId}/end`);
      fetchSessions(selectedDate); // Refresh sessions after ending one
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
            <th>School</th> {/* Changed from Location to School */}
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
              <td>{session.schoolName}</td> {/* Changed from Location to School */}
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
