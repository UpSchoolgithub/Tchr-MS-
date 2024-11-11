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

  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
      setSessions(response.data);
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

  useEffect(() => {
    const day = getDayName(selectedDate);
    const filtered = sessions.filter(session => session.day === day);
    setFilteredSessions(filtered);
  }, [selectedDate, sessions]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleStartSession = (session) => {
    navigate('/session-details', { state: { session } });
  };

  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

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
