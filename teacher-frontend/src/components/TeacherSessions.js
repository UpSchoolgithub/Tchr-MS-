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
  const [filter, setFilter] = useState({ subject: '', progress: '' }); // Add filtering options
  const maxRetries = 3;
  let retryCount = 0;

  const fetchSessionPlansForToday = async (teacherId, sectionId, subjectId) => {
    try {
      const response = await axiosInstance.get(
        `/teachers/${teacherId}/sections/${sectionId}/subjects/${subjectId}/sessions`
      );
  
      const todayDate = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  
      // Filter sessions for today
      const sessionsForToday = response.data.sessions.filter((session) => {
        const sessionDate = new Date(session.sessionDate).toISOString().split('T')[0];
        return sessionDate === todayDate;
      });
  
      return sessionsForToday.length > 0 ? sessionsForToday : [];
    } catch (error) {
      console.error('Error fetching session plans for today:', error);
      return [];
    }
  };
  
  //viewing session plans
  const handleViewPlan = (sessionPlans) => {
    if (!sessionPlans || sessionPlans.length === 0) {
      alert('No session plan available for this session.');
      console.log("No session plans found:", sessionPlans);
      return;
    }
    navigate(`/session-plans`, { state: { sessionPlans } });
  };
  
  
  // Utility function to get the day name
  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Fetch sessions assigned to the teacher along with session plans
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
  
      const sessionsWithDetails = response.data.map((session) => ({
        ...session,
        completed: !!session.endTime, // Mark as completed if endTime exists
        inProgress: session.startTime && !session.endTime, // Mark as in-progress if only startTime exists
      }));
  
      setSessions(sessionsWithDetails);
      setError(null);
    } catch (err) {
      setError(`Failed to load sessions: ${err.message}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);
  
  
  
  
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filter sessions based on selected day and additional filters
  useEffect(() => {
    const day = getDayName(selectedDate);
    let filtered = sessions.filter((session) => session.day === day);

    // Apply subject and progress filters
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

  // Handle date change for filtering sessions
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Handle start session button click
  const handleStartSession = (session) => {
    if (!session.sectionId) {
      console.error('Section ID is undefined for the session:', session);
      alert('Unable to start session: Section ID is missing.');
      return;
    }
  
    navigate(`/teacherportal/${teacherId}/session-details`, {
      state: {
        teacherId,
        classId: session.classId,
        sectionId: session.sectionId,
        subjectId: session.subjectId,
        schoolId: session.schoolId,
        day: session.day,
        period: session.period,
        sessionId: session.sessionId, // Include sessionId
      },
    });
  };
  
  const getSessionStatus = (session) => {
    if (session.status === 'completed') return 'Completed';
    if (session.startTime && !session.endTime) return 'In Progress';
    return 'Pending';
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

      {filteredSessions.length === 0 ? (
  <p className="no-sessions-message">No sessions found for {getDayName(selectedDate)}.</p>
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
        <th>Progress</th>
        <th>Start Time</th>
        <th>End Time</th>
        <th>Assignments</th>
        <th>Today's Session Plan</th>

        <th>Session Report</th>
      </tr>
    </thead>
    <tbody>
  {filteredSessions.map((session, index) => {
    const progressPercentage =
      session.totalTopics > 0 ? (session.completedTopics / session.totalTopics) * 100 : 0;

    return (
      <tr key={index}>
        <td>{session.schoolName}</td>
        <td>{session.className}</td>
        <td>{session.sectionName}</td>
        <td>{session.sectionId}</td>
        <td>{session.day}</td>
        <td>{session.period}</td>
        <td>{session.subjectName}</td>
        <td>
          <div className="progress-container">
            <div className="progress-bar">
              <span style={{ width: `${progressPercentage}%` }}></span>
            </div>
            <small>
              {session.completedTopics || 0}/{session.totalTopics || 0} topics completed
            </small>
          </div>
        </td>
        <td>
  {session.status === 'completed' ? (
    <>
      <p><strong>Start:</strong> {session.startTime ? new Date(session.startTime).toLocaleTimeString() : 'Not Started'}</p>
<p><strong>End:</strong> {session.endTime ? new Date(session.endTime).toLocaleTimeString() : 'Not Ended'}</p>
    </>
  ) : isToday(selectedDate) ? (
    <button
      onClick={() => handleStartSession(session)}
      style={{ backgroundColor: '#dc3545', color: 'white' }}
      disabled={!!session.startTime} // Disable if startTime exists
    >
      {session.startTime ? 'In Progress' : 'Start Session'}
    </button>
  ) : (
    <span>Pending</span>
  )}
</td>

<td>{getSessionStatus(session)}</td>



        <td>{session.endTime}</td>
        <td>
          <button style={{ backgroundColor: 'green' }}>Update</button>
          <button
            style={{
              backgroundColor: 'lightgreen',
              marginLeft: '5px',
            }}
          >
            Notify
          </button>
        </td>
        <td>
  {session.sessionPlansForToday && session.sessionPlansForToday.length > 0 ? (
    <button
      onClick={() => navigate(`/session-plans`, { state: { sessionPlans: session.sessionPlansForToday } })}
    >
      View Plan
    </button>
  ) : (
    <span>No Plan</span>
  )}
</td>


        <td>
          <button
            style={{ backgroundColor: 'white'}}
            onClick={() => {
              navigate(`/session-reports/${session.sessionId}`);
            }}
          >
            Session Report
          </button>
        </td>
      </tr>
    );
  })}
</tbody>

  </table>
)}

    </div>
  );
};

export default TeacherSessions;
