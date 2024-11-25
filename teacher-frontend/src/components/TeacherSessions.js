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
  const [weeklySessions, setWeeklySessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState({ subject: '', progress: '' });
  const maxRetries = 3;
  let retryCount = 0;

  // Utility function to get the day name
  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Utility function to calculate the start and end dates of the week
  const getWeekRange = (date) => {
    const start = new Date(date);
    const end = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1); // Set to Monday
    end.setDate(start.getDate() + 6); // Set to Sunday
    return { start, end };
  };

  // Fetch sessions assigned to the teacher along with session plans
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

  // Filter sessions for the entire week
  useEffect(() => {
    const { start, end } = getWeekRange(selectedDate);
    const filtered = sessions.filter((session) => {
      const sessionDate = new Date(session.date); // Assuming `session.date` contains the session date
      return sessionDate >= start && sessionDate <= end;
    });

    // Group sessions by day
    const grouped = filtered.reduce((acc, session) => {
      const day = getDayName(new Date(session.date));
      if (!acc[day]) acc[day] = [];
      acc[day].push(session);
      return acc;
    }, {});

    setWeeklySessions(grouped);
  }, [selectedDate, sessions]);

  // Handle date change for week navigation
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleStartSession = (session) => {
    if (!session.sectionId) {
      console.error('Section ID is undefined for the session:', session);
      alert('Unable to start session: Section ID is missing.');
      return;
    }

    navigate(`/teacherportal/${teacherId}/session-details`, {
      state: {
        teacherId,
        classId: session.classId, // Pass classId
        sectionId: session.sectionId,
        subjectId: session.subjectId, // Pass subjectId
        schoolId: session.schoolId, // Pass schoolId
        day: session.day,
        period: session.period,
      },
    });
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="sessions-container">
      <h2>Teacher Sessions - Week of {getWeekRange(selectedDate).start.toDateString()}</h2>

      <div className="navigation-buttons">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
        />

        {/* Filters for subject and progress */}
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

      {Object.keys(weeklySessions).length === 0 ? (
        <p>No sessions found for this week.</p>
      ) : (
        Object.keys(weeklySessions).map((day) => (
          <div key={day} className="day-section">
            <h3>{day}</h3>
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Subject</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {weeklySessions[day].map((session, index) => (
                  <tr key={index}>
                    <td>{session.schoolName}</td>
                    <td>{session.className}</td>
                    <td>{session.sectionName}</td>
                    <td>{session.subjectName}</td>
                    <td>
                      {session.completedTopics || 0}/{session.totalTopics || 0} topics completed
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default TeacherSessions;
