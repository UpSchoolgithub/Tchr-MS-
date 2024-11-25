import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const [sessionReport, setSessionReport] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const maxRetries = 3;
  let retryCount = 0;

  const { sessionId } = location.state || {}; // Extract sessionId from navigation state

  // Automatically fetch session report if sessionId exists in location state
  useEffect(() => {
    if (sessionId) {
      fetchSessionReport(sessionId); // Fetch the session report
      navigate('/teacherportal/' + teacherId, { replace: true }); // Clear sessionId from state
    }
  }, [sessionId, teacherId, navigate]);

  // Utility function to get the day name
  const getDayName = (date) => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  };

  // Fetch sessions assigned to the teacher along with session plans
  const retryCountRef = useRef(0);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
      setSessions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        fetchSessions(); // Retry fetching sessions
      } else {
        setError(`Failed to load sessions: ${err.message}. Please try again later.`);
      }
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
      filtered = filtered.filter(
        (session) => session.completedTopics === session.totalTopics
      );
    }
    if (filter.progress === 'incomplete') {
      filtered = filtered.filter(
        (session) => session.completedTopics < session.totalTopics
      );
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
        classId: session.classId, // Pass classId
        sectionId: session.sectionId,
        subjectId: session.subjectId, // Pass subjectId
        schoolId: session.schoolId, // Pass schoolId
        day: session.day,
        period: session.period,
      },
    });
  };

  // Fetch session report data
  const fetchSessionReport = async (sessionId) => {
    setLoadingReport(true);
    try {
      const response = await axiosInstance.get(`/sessions/${sessionId}/details`);
      setSessionReport(response.data.sessionReport);
      setReportError(null);
    } catch (err) {
      console.error('Error fetching session report:', err);
      setReportError(`Failed to load session report: ${err.message}`);
    } finally {
      setLoadingReport(false);
    }
  };

  // Handle view session report button click
  const handleViewSessionReport = (sessionId) => {
    if (!sessionId) {
      console.error('Session ID is undefined.');
      alert('Cannot fetch report. Session ID is missing.');
      return;
    }
    fetchSessionReport(sessionId);
  };
  

  const isToday = (date) => date.toDateString() === new Date().toDateString();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="sessions-container">
      <h2>
        Teacher Sessions - {getDayName(selectedDate)}'s Sessions ({selectedDate.toDateString()})
      </h2>

      <div className="navigation-buttons">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          maxDate={new Date()}
          dateFormat="yyyy-MM-dd"
        />

        {/* Filters for subject and progress */}
        <select
          onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
          value={filter.subject}
        >
          <option value="">All Subjects</option>
          {Array.from(new Set(sessions.map((session) => session.subjectName))).map(
            (subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            )
          )}
        </select>

        <select
          onChange={(e) => setFilter({ ...filter, progress: e.target.value })}
          value={filter.progress}
        >
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
              <th>Section ID</th>
              <th>Day</th>
              <th>Period</th>
              <th>Subject</th>
              <th>Progress</th>
              <th>Session Started</th>
              <th>Session Ended</th>
              <th>Assignments</th>
              <th>Session Report</th>
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
                <td>{session.endTime || '-'}</td>
                <td>
                  <button style={{ backgroundColor: 'green', color: 'white' }}>
                    Update
                  </button>
                  <button
                    style={{
                      backgroundColor: 'lightgreen',
                      color: 'black',
                      marginLeft: '5px',
                    }}
                  >
                    Notify
                  </button>
                </td>
                <td>
                  <button
                    style={{ backgroundColor: 'blue', color: 'white' }}
                    onClick={() => handleViewSessionReport(session.sessionId || session.id)}
                  >
                    View Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Display Session Report */}
      {loadingReport && <p>Loading session report...</p>}
      {reportError && <p className="error">{reportError}</p>}
      {sessionReport && (
        <div className="session-report-container">
          <h3>Session Report</h3>
          <p>
            <strong>Sessions Completed:</strong>{' '}
            {sessionReport.sessionsCompleted
              ? sessionReport.sessionsCompleted.join(', ')
              : 'None'}
          </p>
          <p>
            <strong>Sessions To Complete:</strong>{' '}
            {sessionReport.sessionsToComplete
              ? sessionReport.sessionsToComplete.join(', ')
              : 'None'}
          </p>
          <p>
            <strong>Absent Students:</strong>{' '}
            {sessionReport.absentStudents
              ? sessionReport.absentStudents.join(', ')
              : 'None'}
          </p>
          <p>
            <strong>Assignment Details:</strong>{' '}
            {sessionReport.assignmentDetails || 'None'}
          </p>
          <p>
            <strong>Observation Details:</strong>{' '}
            {sessionReport.observationDetails || 'None'}
          </p>
          <button
            onClick={() => setSessionReport(null)}
            style={{ marginTop: '10px' }}
          >
            Close Report
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherSessions;
