import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams, useLocation } from 'react-router-dom';

const SessionDetails = () => {
  const { teacherId, sessionId } = useParams();
  const location = useLocation();
  const { schoolId, classId, sectionId, subjectId } = location.state || {};

  const [sessionDetails, setSessionDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!schoolId || !classId || !sectionId || !subjectId) {
      console.error("Missing required parameters to fetch session details");
      setError('Missing required parameters to fetch session details');
      setLoading(false);
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions`);
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
      <h2>Session Details for Section {sectionId}</h2>
      {sessionDetails.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Chapter Name</th>
              <th>Number of Sessions</th>
              <th>Priority Number</th>
            </tr>
          </thead>
          <tbody>
            {sessionDetails.map((session) => (
              <tr key={session.id}>
                <td>{session.chapterName}</td>
                <td>{session.numberOfSessions}</td>
                <td>{session.priorityNumber}</td>
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
