import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionReport.css';

const SessionReport = () => {
  const location = useLocation();
  const { sessionId } = location.state || {};
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessionReport = async () => {
      if (!sessionId) {
        setError('Session ID is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/sessions/${sessionId}/report`);
        setReport(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching session report:', err);
        setError('Failed to load session report.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionReport();
  }, [sessionId]);

  if (loading) return <p>Loading session report...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="session-report-container">
      <h2>Session Report</h2>
      <p><strong>Session ID:</strong> {report.sessionId}</p>
      <p><strong>Session Plan ID:</strong> {report.sessionPlanId}</p>
      <p><strong>Chapter Name:</strong> {report.chapterName}</p>
      <p><strong>Session Date:</strong> {report.sessionDate}</p>
      <p><strong>Completed Topics:</strong> {report.completedTopics.join(', ')}</p>
      <p><strong>Incomplete Topics:</strong> {report.incompleteTopics.join(', ')}</p>
      <p><strong>Observations:</strong> {report.observationDetails}</p>
      <p><strong>Absent Students:</strong> {report.absentStudents.join(', ')}</p>
      <p><strong>Assignment Details:</strong> {report.assignmentDetails || 'N/A'}</p>
    </div>
  );
};

export default SessionReport;
