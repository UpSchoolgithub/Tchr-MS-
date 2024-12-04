import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionReport.css';

const SessionReport = () => {
  const location = useLocation();
  const { sessionId } = location.state || {};
  const [sessionReport, setSessionReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessionReport = async () => {
      try {
        const response = await axiosInstance.get(`/api/session-reports/${sessionId}`);
        setSessionReport(response.data);
      } catch (err) {
        setError('Failed to load session report. Please try again later.');
        console.error('Error fetching session report:', err);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) fetchSessionReport();
  }, [sessionId]);

  if (loading) return <p>Loading session report...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="session-report-container">
      <h2>Session Report</h2>
      {sessionReport ? (
        <div className="session-report-details">
          <p><strong>Session ID:</strong> {sessionReport.sessionId}</p>
          <p><strong>Date:</strong> {sessionReport.date}</p>
          <p><strong>Day:</strong> {sessionReport.day}</p>
          <p><strong>Teacher Name:</strong> {sessionReport.teacherName || 'N/A'}</p>
          <p><strong>School:</strong> {sessionReport.schoolName || 'N/A'}</p>
          <p><strong>Class:</strong> {sessionReport.className || 'N/A'}</p>
          <p><strong>Section:</strong> {sessionReport.sectionName || 'N/A'}</p>
          <p><strong>Subject:</strong> {sessionReport.subjectName || 'N/A'}</p>
          <p><strong>Completed Topics:</strong> {sessionReport.sessionsCompleted || 'N/A'}</p>
          <p><strong>Pending Topics:</strong> {sessionReport.sessionsToComplete || 'N/A'}</p>
          <p><strong>Observations:</strong> {sessionReport.observationDetails || 'N/A'}</p>
          <p><strong>Absentees:</strong> {sessionReport.absentStudents || 'None'}</p>
        </div>
      ) : (
        <p>No report data found for this session.</p>
      )}
    </div>
  );
};

export default SessionReport;
