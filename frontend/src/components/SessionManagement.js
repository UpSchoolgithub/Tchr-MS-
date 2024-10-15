import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const SessionManagement = () => {
  const { schoolId, classId, sectionId, subjectId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingNumberOfSessions, setEditingNumberOfSessions] = useState('');
  const [editingPriorityNumber, setEditingPriorityNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to fetch sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [schoolId, classId, sectionId, subjectId]);

  const startEditing = (session) => {
    setEditingSessionId(session.id);
    setEditingNumberOfSessions(session.numberOfSessions);
    setEditingPriorityNumber(session.priorityNumber);
  };

  const handleSessionUpdate = async (sessionId) => {
    try {
      const response = await axios.put(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`, {
        numberOfSessions: editingNumberOfSessions,
        priorityNumber: editingPriorityNumber,
      });
      setSessions(sessions.map(session => (session.id === sessionId ? response.data : session)));
      setEditingSessionId(null);
    } catch (error) {
      setError('Failed to update session.');
    }
  };

  const handleSessionDelete = async (sessionId) => {
    try {
      await axios.delete(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`);
      setSessions(sessions.filter(session => session.id !== sessionId));
    } catch (error) {
      setError('Failed to delete session.');
    }
  };

  const handleDeleteAll = async () => {
    try {
      await axios.delete(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions`);
      setSessions([]);
    } catch (error) {
      setError('Failed to delete all sessions.');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const file = e.target.elements.file.files[0];
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const uploadUrl = `/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions/upload`;
      await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchSessions(); // Refresh sessions list after upload
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.response?.data?.error || 'Failed to upload file.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Session Management</h2>
      {error && <div className="error">{error}</div>}
      {isLoading && <p>Loading...</p>}

      <form onSubmit={handleFileUpload}>
        <input type="file" name="file" accept=".xlsx, .xls" required />
        <button type="submit">Upload</button>
      </form>

      <button onClick={handleDeleteAll} style={{ marginTop: '20px', backgroundColor: 'red', color: 'white' }}>
        Delete All
      </button>

      {sessions.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Chapter</th>
              <th>Number of Sessions</th>
              <th>Priority Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id}>
                <td>{session.chapterName}</td>
                <td>
                  {editingSessionId === session.id ? (
                    <input
                      type="number"
                      value={editingNumberOfSessions}
                      onChange={(e) => setEditingNumberOfSessions(e.target.value)}
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
                      <Link to={`/sessions/${session.id}/sessionPlans`}><button>Session Plan</button></Link>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No sessions available. Please upload or add new sessions.</p>
      )}
    </div>
  );
};

export default SessionManagement;
