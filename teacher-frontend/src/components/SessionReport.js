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
      <p><strong>School:</strong> {report.schoolName}</p>
      <p><strong>Class:</strong> {report.className}</p>
      <p><strong>Teacher:</strong> {report.teacherName}</p>
      <p><strong>Subject:</strong> {report.subjectName}</p>
      <p><strong>Section:</strong> {report.sectionName}</p>
      <p><strong>Chapter:</strong> {report.chapterName}</p>
      <p><strong>Topics Covered:</strong> {report.sessionsCompleted.join(', ')}</p>
      <p><strong>Absentees:</strong> {report.absentStudents.join(', ')}</p>
      <p><strong>Observations:</strong> {report.observationDetails}</p>
      <p><strong>Assignment Status:</strong> {report.assignmentDetails ? 'Assigned' : 'Not Assigned'}</p>
    </div>
  );
};

export default SessionReport;
