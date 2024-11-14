import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

const SessionDetails = () => {
  const { schoolId, classId, sectionId, subjectId } = useParams();
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/session-details`);
        setSessionDetails(response.data);
      } catch (error) {
        console.error('Error fetching session details:', error);
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [schoolId, classId, sectionId, subjectId]);

  if (loading) return <p>Loading session details...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Session Details for Section {sessionDetails.sectionId}</h2>
      {sessionDetails.sessionDetails && sessionDetails.sessionDetails.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Chapter Name</th>
              <th>Number of Sessions</th>
              <th>Priority Number</th>
              <th>Section Name</th>
              <th>Subject Name</th>
            </tr>
          </thead>
          <tbody>
            {sessionDetails.sessionDetails.map((session) => (
              <tr key={session.id}>
                <td>{session.chapterName}</td>
                <td>{session.numberOfSessions}</td>
                <td>{session.priorityNumber}</td>
                <td>{session.sectionName}</td>
                <td>{session.subjectName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No session plans found for this section.</p>
      )}
    </div>
  );
};

export default SessionDetails;
