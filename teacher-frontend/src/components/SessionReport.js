import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionReport.css';

const SessionReport = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      if (!sessionId) {
        console.error('Session ID is undefined. Cannot fetch session report.');
        return;
      }
    
      try {
        const response = await axiosInstance.get(`/sessions/${sessionId}/details`);
        setReport(response.data.sessionReport);
      } catch (error) {
        console.error('Error fetching session report:', error);
        setError('Failed to load session report.');
      }
    };
    

    fetchReport();
  }, [sessionId]);

  if (loading) return <p>Loading session report...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="session-report-container">
      <h2>Session Report</h2>
      {report ? (
        <div className="report-details">
          <p><strong>School:</strong> {report.schoolName || 'N/A'}</p>
          <p><strong>Class:</strong> {report.className || 'N/A'}</p>
          <p><strong>Teacher Name:</strong> {report.teacherName || 'N/A'}</p>
          <p><strong>Subject:</strong> {report.subjectName || 'N/A'}</p>
          <p><strong>Section:</strong> {report.sectionName || 'N/A'}</p>
          <p><strong>Chapter:</strong> {report.chapterName || 'N/A'}</p>
          <p><strong>Topics Covered:</strong></p>
          <ul>
            {report.sessionsCompleted.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
          <p><strong>Absent Students:</strong></p>
          <ul>
            {report.absentStudents.map((student, index) => (
              <li key={index}>{student}</li>
            ))}
          </ul>
          <p><strong>Observation:</strong> {report.observationDetails || 'N/A'}</p>
          <p><strong>Assignment Status:</strong> {report.assignmentDetails || 'No Assignment'}</p>
        </div>
      ) : (
        <p>No report details available.</p>
      )}
      <button onClick={() => navigate(-1)} style={{ backgroundColor: 'blue', color: 'white', marginTop: '20px' }}>
        Back to Sessions
      </button>
    </div>
  );
};

export default SessionReport;
