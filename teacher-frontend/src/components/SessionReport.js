import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

const SessionReport = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId || sessionId === 'undefined') {
      console.error('Invalid sessionId:', sessionId);
      setError('Invalid session ID provided.');
      return;
    }

    const fetchReport = async () => {
      try {
        const response = await axiosInstance.get(`/sessions/${sessionId}/details`);
        setReport(response.data.sessionReport);
      } catch (err) {
        console.error('Error fetching session report:', err);
        setError('Failed to load session report.');
      }
    };

    fetchReport();
  }, [sessionId]);

  if (error) return <p>{error}</p>;
  if (!report) return <p>Loading...</p>;

  return (
    <div>
      <h2>Session Report</h2>
      <p><strong>School:</strong> {report.schoolName || 'N/A'}</p>
      <p><strong>Class:</strong> {report.className || 'N/A'}</p>
      <p><strong>Section:</strong> {report.sectionName || 'N/A'}</p>
      <p><strong>Teacher:</strong> {report.teacherName || 'N/A'}</p>
      <p><strong>Subject:</strong> {report.subjectName || 'N/A'}</p>
      <p><strong>Chapter:</strong> {report.chapterName || 'N/A'}</p>
      <p><strong>Date:</strong> {report.date || 'N/A'}</p>
      <p><strong>Day:</strong> {report.day || 'N/A'}</p>

      <h3>Topics</h3>
      <p><strong>Completed:</strong></p>
      <ul>
        {report.sessionsCompleted && report.sessionsCompleted.length > 0 ? (
          report.sessionsCompleted.map((topic, index) => <li key={index}>{topic}</li>)
        ) : (
          <p>No topics were completed in this session.</p>
        )}
      </ul>
      <p><strong>Incomplete:</strong></p>
      <ul>
        {report.sessionsToComplete && report.sessionsToComplete.length > 0 ? (
          report.sessionsToComplete.map((topic, index) => <li key={index}>{topic}</li>)
        ) : (
          <p>All topics were completed in this session.</p>
        )}
      </ul>

      <p><strong>Absentees:</strong> {report.absentStudents.join(', ') || 'None'}</p>
      <p><strong>Observations:</strong> {report.observationDetails || 'None'}</p>
      <p><strong>Assignment:</strong> {report.assignmentDetails ? 'Assigned' : 'Not Assigned'}</p>
    </div>
  );
};

export default SessionReport;
