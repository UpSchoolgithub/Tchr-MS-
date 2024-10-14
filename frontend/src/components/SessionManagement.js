import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const SessionManagement = () => {
  const { schoolId, classId, sectionId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingNumberOfSessions, setEditingNumberOfSessions] = useState('');
  const [editingPriorityNumber, setEditingPriorityNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions`);
        setSessions(response.data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setError('Failed to fetch sessions.');
      }
    };
    fetchSessions();
  }, [schoolId, classId, sectionId]);

  const handleSessionUpdate = async (sessionId) => {
    setError('');
    try {
      const response = await axios.put(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`, {
        numberOfSessions: editingNumberOfSessions,
        priorityNumber: editingPriorityNumber
      });
      setSessions(sessions.map(session => (session.id === sessionId ? response.data : session)));
      setEditingSessionId(null);
    } catch (error) {
      console.error('Error updating session:', error);
      setError(error.response?.data?.error || 'Failed to update session.');
    }
  };

  const handleSessionDelete = async (sessionId) => {
    try {
      await axios.delete(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`);
      setSessions(sessions.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session.');
    }
  };

  const handleDeleteAll = async () => {
    try {
      await axios.delete(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions`);
      setSessions([]);
    } catch (error) {
      console.error('Error deleting all sessions:', error);
      setError('Failed to delete all sessions.');
    }
  };

  const startEditing = (session) => {
    setEditingSessionId(session.id);
    setEditingNumberOfSessions(session.numberOfSessions);
    setEditingPriorityNumber(session.priorityNumber);
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditingNumberOfSessions('');
    setEditingPriorityNumber('');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const file = e.target.elements.file.files[0];
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const response = await axios.get(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.response?.data?.error || 'Failed to upload file.');
    }
  };

  return (
    <div>
      <h2>Session Management</h2>
      {error && <div className="error">{error}</div>}

      {/* File upload form only */}
      <form onSubmit={handleFileUpload}>
        <div>
          <label>Upload Sessions:</label>
          <input type="file" name="file" accept=".xlsx, .xls" required />
        </div>
        <button type="submit">Upload</button>
      </form>

      <button onClick={handleDeleteAll} style={{ marginTop: '20px', backgroundColor: 'red', color: 'white' }}>Delete All</button>

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
                  <input type="number" value={editingNumberOfSessions} onChange={(e) => setEditingNumberOfSessions(e.target.value)} />
                ) : (
                  session.numberOfSessions
                )}
              </td>
              <td>
                {editingSessionId === session.id ? (
                  <input type="number" value={editingPriorityNumber} onChange={(e) => setEditingPriorityNumber(e.target.value)} />
                ) : (
                  session.priorityNumber
                )}
              </td>
              <td>
                {editingSessionId === session.id ? (
                  <>
                    <button onClick={() => handleSessionUpdate(session.id)}>Save</button>
                    <button onClick={cancelEditing}>Cancel</button>
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SessionManagement;
