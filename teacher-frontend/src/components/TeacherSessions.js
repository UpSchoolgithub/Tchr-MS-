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
  const [filter, setFilter] = useState({ subject: '', progress: '' });
  const maxRetries = 3;
  let retryCount = 0;

  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
      setSessions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      if (retryCount < maxRetries) {
        retryCount += 1;
        fetchSessions();
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

  useEffect(() => {
    const day = getDayName(selectedDate);
    let filtered = sessions.filter((session) => session.sessionDate === selectedDate.toISOString().split('T')[0]);

    if (filter.subject) {
      filtered = filtered.filter((session) => session.subjectName === filter.subject);
    }
    if (filter.progress === 'completed') {
      filtered = filtered.filter((session) => session.completedTopics === session.totalTopics);
    }
    if (filter.progress === 'incomplete') {
      filtered = filtered.filter((session) => session.completedTopics < session.totalTopics);
    }

    setFilteredSessions(filtered);
  }, [selectedDate, sessions, filter]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleStartSession = (session) => {
    if (!session.sessionId) {
      alert('Session ID is missing. Cannot proceed to session details.');
      return;
    }

    navigate(`/teacherportal/${teacherId}/session-details/${session.sectionId}/${session.sessionId}`, {
      state: {
        classId: session.classId,
        subjectId: session.subjectId,
        schoolId: session.schoolId,
        sectionId: session.sectionId,
        sessionId: session.sessionId,
        chapterName: session.chapterName || 'N/A',
        topics: session.topics || [],
      },
    });
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

        <select onChange={(e) => setFilter({ ...filter, subject: e.target.value })}>
          <option value="">All Subjects</option>
          {Array.from(new Set(sessions.map((session) => session.subjectName))).map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>

        <select onChange={(e) => setFilter({ ...filter, progress: e.target.value })}>
          <option value="">All Progress</option>
          <option value="completed">Completed</option>
          <option value="incomplete">Incomplete</option>
        </select>
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
              <th>Session Date</th>
              <th>Subject</th>
              <th>Progress</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((session, index) => (
              <tr key={index}>
                <td>{session.school}</td>
                <td>{session.class}</td>
                <td>{session.section}</td>
                <td>{session.sessionDate}</td>
                <td>{session.subject}</td>
                <td>
                  {session.completedTopics}/{session.totalTopics} topics completed
                </td>
                <td>{session.startTime}</td>
                <td>{session.endTime}</td>
                <td>
                  <button
                    onClick={() => handleStartSession(session)}
                    style={{ backgroundColor: 'orange', color: 'black' }}
                  >
                    Start Session
                  </button>
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
