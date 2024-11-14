import React, { useEffect, useState, useCallback } from 'react';
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
  const maxRetries = 3;
  let retryCount = 0;

  // Utility function to get the day name
  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Fetch sessions assigned to the teacher
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
      setSessions(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      if (retryCount < maxRetries) {
        retryCount += 1;
        fetchSessions(); // Retry fetching sessions
      } else {
        setError(`Failed to load sessions: ${err.message}. Please try again later.`);
      }
    } finally {
      setLoading(false);
    }
  }, [teacherId, retryCount]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filter sessions based on selected day
  useEffect(() => {
    const day = getDayName(selectedDate);
    const filtered = sessions.filter((session) => session.day === day);
    setFilteredSessions(filtered);
  }, [selectedDate, sessions]);

  // Handle date change for filtering sessions
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Handle start session button click
  const handleStartSession = async (session) => {
    try {
      // Use navigate to move to the session details with required information
      navigate(`/teacherportal/${teacherId}/session-details/${session.sectionId}/${session.id}`, {
        state: {
          classId: session.classId,
          subject: session.subjectName,
          school: session.schoolName,
          sectionName: session.sectionName,
          sectionId: session.sectionId,
          sessionId: session.id,
          sessionPlanId: session.sessionPlanId, // Pass sessionPlanId if available
        },
      });
    } catch (error) {
      console.error("Error navigating to session details:", error);
      setError('Failed to navigate to session details.');
    }
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();

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
                    <button onClick={() => handleStartSession(session)} style={{ backgroundColor: 'orange', color: 'black' }}>
                      Start Session
                    </button>
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td>{session.endTime}</td>
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
