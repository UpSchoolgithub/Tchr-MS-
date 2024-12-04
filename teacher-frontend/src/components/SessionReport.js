import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionReport.css';

const SessionReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = location.state || {}; // Get session ID from navigation state

  const [sessionReport, setSessionReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the session report
  useEffect(() => {
    const fetchSessionReport = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/api/session-reports/${sessionId}`);
        setSessionReport(response.data);
      } catch (error) {
        setError('Failed to fetch session report. Please try again later.');
        console.error('Error fetching session report:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionReport();
    } else {
      setError('Session ID is missing. Cannot fetch session report.');
    }
  }, [sessionId]);

  return (
    <div className="session-report-container">
      <h2>Session Report</h2>

      {loading ? (
        <p>Loading session report...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : sessionReport ? (
        <div>
          <p><strong>Topics Completed:</strong> {sessionReport.completedTopics.join(', ') || 'None'}</p>
          <p><strong>Topics Remaining:</strong> {sessionReport.incompleteTopics.join(', ') || 'None'}</p>
          <p><strong>Observations:</strong> {sessionReport.observations || 'No observations available'}</p>
          <p><strong>Absentees:</strong> {sessionReport.absentStudents.join(', ') || 'None'}</p>
          <p><strong>Assignments:</strong> {sessionReport.assignmentDetails || 'No assignments given'}</p>
        </div>
      ) : (
        <p>No session report available for this session.</p>
      )}

      <button onClick={() => navigate(-1)} className="back-button">
        Back
      </button>
    </div>
  );
};

export default SessionReport;
