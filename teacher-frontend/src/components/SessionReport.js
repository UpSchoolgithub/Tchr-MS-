import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionReport.css';

const SessionReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, sessionDetails: initialSessionDetails } = location.state || {};

  const [sessionDetails, setSessionDetails] = useState(initialSessionDetails || null);
  const [loading, setLoading] = useState(!initialSessionDetails);
  const [error, setError] = useState(null);

  // Fetch session details if not passed
  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionDetails && sessionId) {
        setLoading(true);
        try {
          const response = await axiosInstance.get(`/teachers/sessions/${sessionId}`);
          setSessionDetails(response.data);
        } catch (err) {
          setError('Failed to fetch session details. Please try again later.');
          console.error('Error fetching session details:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSessionDetails();
  }, [sessionId, sessionDetails]);

  if (loading) return <p>Loading session report...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="session-report-container">
      <h2>Session Report</h2>
      <div className="session-report-details">
        <p><strong>Session ID:</strong> {sessionDetails.sessionId}</p>
        <p><strong>Session Plan ID:</strong> {sessionDetails.sessionPlanId}</p>
        <p><strong>Chapter Name:</strong> {sessionDetails.chapterName || 'N/A'}</p>
        <p><strong>Session Number:</strong> {sessionDetails.sessionNumber || 'N/A'}</p>
        <p><strong>Topics Completed:</strong> {sessionDetails.completedTopics?.join(', ') || 'None'}</p>
        <p><strong>Topics Remaining:</strong> {sessionDetails.incompleteTopics?.join(', ') || 'None'}</p>
        <p><strong>Observations:</strong> {sessionDetails.observations || 'None'}</p>
        <p><strong>Absentees:</strong> {sessionDetails.absentStudents?.join(', ') || 'None'}</p>
        <p><strong>Assignments:</strong> {sessionDetails.assignmentDetails || 'No assignments given'}</p>
      </div>
      <button className="back-button" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default SessionReport;
