// src/components/TeacherSessions.js
import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams } from 'react-router-dom';
import './TeacherSessions.css';

const TeacherSessions = () => {
  const { teacherId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Utility function to get day name from a date
  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const fetchSessions = async (date) => {
    setLoading(true);
    try {
      const day = getDayName(date);
      const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`, {
        params: { day }
      });
      setSessions(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError('Failed to load sessions');
      setLoading(false);
    }
  };

  // Fetch sessions whenever selectedDate changes
  useEffect(() => {
    fetchSessions(selectedDate);
  }, [selectedDate, teacherId]);

  const handlePreviousDay = () => {
    const previousDate = new Date(selectedDate);
    previousDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(previousDate);
  };

  // Prevent going to future dates
  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    const today = new Date();
    if (nextDate < today) {
      nextDate.setDate(selectedDate.getDate() + 1);
      setSelectedDate(nextDate);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="sessions-container">
      <h2>Teacher Sessions - {getDayName(selectedDate)}'s Sessions ({selectedDate.toDateString()})</h2>
      <div className="navigation-buttons">
        <button onClick={handlePreviousDay}>Previous Day</button>
        <button onClick={handleNextDay} disabled={selectedDate >= new Date()}>Next Day</button>
      </div>
      {sessions.length === 0 ? (
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
              <th>Start Time</th>
              <th>End Time</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => (
              <tr key={index}>
                <td>{session.schoolName}</td>
                <td>{session.className}</td>
                <td>{session.sectionName}</td>
                <td>{session.day}</td>
                <td>{session.period}</td>
                <td>{session.subjectName}</td>
                <td>{session.startTime}</td>
                <td>{session.endTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TeacherSessions;
