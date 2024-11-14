import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './TeacherSessions.css';

const TeacherSessions = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get the day of the week from a date
  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Fetch sessions from the backend
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
      console.log("Fetched sessions:", response.data); // Debugging log to check session data
      const sortedSessions = response.data.sort((a, b) => {
        // Sorting by period
        return a.period - b.period;
      });
      setSessions(sortedSessions);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError('Failed to load sessions');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [teacherId]);

  // Filter sessions based on the selected date
  useEffect(() => {
    const day = getDayName(selectedDate);
    const filtered = sessions.filter(session => session.day === day);
    setFilteredSessions(filtered);
  }, [selectedDate, sessions]);

  // Handle date selection change
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Navigate to session details page
  const handleStartSession = (session) => {
    if (!session.id) {
      console.warn("Session ID is undefined:", session);
    }
    navigate(`/teacherportal/${teacherId}/session-details/${session.sectionId}/${session.id || 'default'}`, {
      state: {
        classId: session.classId || 'N/A',
        subject: session.subjectName || 'N/A',
        school: session.schoolName || 'N/A',
        sectionName: session.sectionName || 'N/A',
        sectionId: session.sectionId || 'N/A',
        sessionId: session.id || 'N/A',
      }
    });
  };

  // Helper function to check if a date is today
  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

  // Render loading and error states
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="sessions-container">
      <h2>Teacher Sessions - {getDayName(selectedDate)}'s Sessions ({selectedDate.toDateString()})</h2>
      <div className="navigation-buttons">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          maxDate={new Date()}
          dateFormat="yyyy-MM-dd"
        />
      </div>
      {filteredSessions.length === 0 ? (
        <p>No sessions found for {getDayName(selectedDate)}.</p>
      ) : (
        <table className="sessions-table">
          <thead>
            <tr>
              <th>School</th>
              <th>Class</th>
              <th>Section</th>
              <th>Section ID</th>
              <th>Day</th>
              <th>Period</th>
              <th>Subject</th>
              <th>Session Started</th>
              <th>Session Ended</th>
              <th>Assignments</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((session, index) => (
              <tr key={index}>
                <td>{session.schoolName}</td>
                <td>{session.className}</td>
                <td>{session.sectionName}</td>
                <td>{session.sectionId}</td>
                <td>{session.day}</td>
                <td>{session.period}</td>
                <td>{session.subjectName}</td>
                <td>
                  {isToday(selectedDate) ? (
                    <button
                      onClick={() => handleStartSession(session)}
                      style={{ backgroundColor: 'orange', color: 'black' }}
                    >
                      Start Session
                    </button>
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td>{session.endTime || '-'}</td>
                <td>
                  <button style={{ backgroundColor: 'green', color: 'white' }}>Update</button>
                  <button style={{ backgroundColor: 'lightgreen', color: 'black', marginLeft: '5px' }}>Notify</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TeacherSessions;
