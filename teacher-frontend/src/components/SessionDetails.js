import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

const SessionDetails = () => {
  const { schoolId, classId, sectionId, subjectId } = useParams();
  const location = useLocation();
  const [sessionDetails, setSessionDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch session details for the specified school, class, section, and subject
    const fetchSessionDetails = async () => {
      if (!schoolId || !classId || !sectionId || !subjectId) {
        setError('Required parameters are missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(
          `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/session-details`
        );
        setSessionDetails(response.data.sessionDetails || []);
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
              <th>Section Name</th>
              <th>Subject Name</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {sessionDetails.map((session) => (
              <tr key={session.id}>
                <td>{session.chapterName}</td>
                <td>{session.numberOfSessions}</td>
                <td>{session.priorityNumber}</td>
                <td>{session.sectionName}</td>
                <td>{session.subjectName}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={session.completed || false}
                    onChange={() => handleCheckboxChange(session.id, !session.completed)}
                  />
                </td>
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
