import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation, Link } from 'react-router-dom';

const SessionManagement = () => {
  const { schoolId, classId, sectionId, subjectId } = useParams();
  const location = useLocation();

  // Extract board name from query string
  const queryParams = new URLSearchParams(location.search);
  const boardName = queryParams.get('board'); // Extract 'board' from the query string

  // State for sessions and other details
  const [sessions, setSessions] = useState([]);
  const [schoolName, setSchoolName] = useState('');
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingNumberOfSessions, setEditingNumberOfSessions] = useState('');
  const [editingPriorityNumber, setEditingPriorityNumber] = useState('');
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sessions and other related details from the API
  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${yourJwtToken}`, // Replace with valid token
          },
        }
      );

      const data = response.data;

      // Extract names and sessions from API response
      setSchoolName(data.schoolName || 'School Name Not Available');
      setClassName(data.className || 'Class Name Not Available');
      setSectionName(data.sectionName || 'Section Name Not Available');
      setSubjectName(data.subjectName || 'Subject Name Not Available');
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching session details:', error);
      setError('Failed to fetch session details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [schoolId, classId, sectionId, subjectId]);

  // Start editing a session
  const startEditing = (session) => {
    setEditingSessionId(session.id);
    setEditingNumberOfSessions(session.numberOfSessions);
    setEditingPriorityNumber(session.priorityNumber);
  };

  // Update a session
  const handleSessionUpdate = async (sessionId) => {
    try {
      await axios.put(
        `/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`,
        {
          numberOfSessions: editingNumberOfSessions,
          priorityNumber: editingPriorityNumber,
        }
      );
      setEditingSessionId(null);
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      setError('Failed to update session. Please check your input and try again.');
    }
  };

  // Delete a session
  const handleSessionDelete = async (sessionId) => {
    try {
      await axios.delete(
        `/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`
      );
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session. Please try again later.');
    }
  };

  // Bulk delete sessions
  const handleBulkDelete = async () => {
    if (selectedSessionIds.length === 0) {
      setError('Please select at least one session to delete.');
      return;
    }
    try {
      await axios.post(
        `/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/bulk-delete`,
        {
          sessionIds: selectedSessionIds,
        }
      );
      setSelectedSessionIds([]);
      fetchSessions();
    } catch (error) {
      console.error('Error deleting sessions:', error);
      setError('Failed to delete sessions. Please try again later.');
    }
  };

  // Toggle selection for bulk delete
  const toggleSelection = (sessionId) => {
    setSelectedSessionIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  return (
    <div>
      <h2>Session Management</h2>
      {error && <div className="error">{error}</div>}
      {isLoading && <p>Loading...</p>}

      {/* Information Banner */}
      <div className="info-banner">
        <p>
          <strong>School Name:</strong> {schoolName} | <strong>School ID:</strong> {schoolId}
        </p>
        <p>
          <strong>Class Name:</strong> {className} | <strong>Class ID:</strong> {classId}
        </p>
        <p>
          <strong>Section Name:</strong> {sectionName} | <strong>Section ID:</strong> {sectionId}
        </p>
        <p>
          <strong>Subject Name:</strong> {subjectName} | <strong>Subject ID:</strong> {subjectId}
        </p>
        <p>
          <strong>Board:</strong> {boardName || 'Board Not Available'}
        </p>
      </div>

      {/* Session Table */}
      <table>
        <thead>
          <tr>
            <th>Unit Name</th>
            <th>Chapter Name</th>
            <th>Number of Sessions</th>
            <th>Priority Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(sessions) && sessions.length > 0 ? (
            sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.unitName || 'N/A'}</td>
                <td>{session.chapterName || 'N/A'}</td>
                <td>
                  {editingSessionId === session.id ? (
                    <input
                      type="number"
                      value={editingNumberOfSessions}
                      onChange={(e) => setEditingNumberOfSessions(e.target.value)}
                      placeholder="Number of Sessions"
                    />
                  ) : (
                    session.numberOfSessions
                  )}
                </td>
                <td>
                  {editingSessionId === session.id ? (
                    <input
                      type="number"
                      value={editingPriorityNumber}
                      onChange={(e) => setEditingPriorityNumber(e.target.value)}
                      placeholder="Priority Number"
                    />
                  ) : (
                    session.priorityNumber
                  )}
                </td>
                <td>
                  {editingSessionId === session.id ? (
                    <>
                      <button onClick={() => handleSessionUpdate(session.id)}>Save</button>
                      <button onClick={() => setEditingSessionId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(session)}>Edit</button>
                      <button onClick={() => handleSessionDelete(session.id)}>Delete</button>
                      <Link to={`/sessions/${session.id}/sessionPlans`}>
                        <button>Session Plan</button>
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: 'gray' }}>
                No sessions available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SessionManagement;
