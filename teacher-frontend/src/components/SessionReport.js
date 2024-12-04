import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useLocation } from 'react-router-dom';

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
        setError('Failed to load session report. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionReport();
    }
  }, [sessionId]);

  if (loading) return <p>Loading session report...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Session Report</h2>
      <p><strong>Session ID:</strong> {sessionReport.sessionId}</p>
      <p><strong>Date:</strong> {sessionReport.date}</p>
      <p><strong>Day:</strong> {sessionReport.day}</p>
      <p><strong>Teacher Name:</strong> {sessionReport.teacherName || 'N/A'}</p>
      <p><strong>School:</strong> {sessionReport.schoolName || 'N/A'}</p>
      <p><strong>Class:</strong> {sessionReport.className || 'N/A'}</p>
      <p><strong>Section:</strong> {sessionReport.sectionName || 'N/A'}</p>
      <p><strong>Subject:</strong> {sessionReport.subjectName || 'N/A'}</p>
      <p><strong>Topics to Complete:</strong></p>
      <ul>
        {JSON.parse(sessionReport.sessionsToComplete).map((topic, idx) => (
          <li key={idx}>{topic}</li>
        ))}
      </ul>
      <p><strong>Topics Completed:</strong></p>
      <ul>
        {JSON.parse(sessionReport.sessionsCompleted).map((topic, idx) => (
          <li key={idx}>{topic}</li>
        ))}
      </ul>
      <p><strong>Absentees:</strong> {JSON.parse(sessionReport.absentStudents).join(', ') || 'None'}</p>
      <p><strong>Observations:</strong> {sessionReport.observationDetails || 'N/A'}</p>
    </div>
  );
};

export default SessionReport;
