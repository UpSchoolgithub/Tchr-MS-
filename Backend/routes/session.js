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
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessions = async () => {
    if (!schoolId || !classId || !sectionId) {
      setError('School ID, Class ID, and Section ID are required.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(error.response?.status === 404 ? 'Sessions not found.' : 'Failed to fetch sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [schoolId, classId, sectionId]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!classId || !sectionId) {
      setError('Class ID and Section ID are required for uploading.');
      return;
    }

    const file = e.target.elements.file.files[0];
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const uploadUrl = `/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/upload`;
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

  // (Include other functions like handleSessionUpdate, handleSessionDelete, handleDeleteAll, startEditing, and cancelEditing as per your original code)

  return (
    <div>
      <h2>Session Management</h2>
      {error && <div className="error">{error}</div>}
      {isLoading && <p>Loading...</p>}

      <form onSubmit={handleFileUpload}>
        <div>
          <label>Upload Sessions:</label>
          <input type="file" name="file" accept=".xlsx, .xls" required />
        </div>
        <button type="submit">Upload</button>
      </form>

      <button onClick={handleDeleteAll} style={{ marginTop: '20px', backgroundColor: 'red', color: 'white' }}>
        Delete All
      </button>

      {/* (Render table with session details and actions) */}
    </div>
  );
};

export default SessionManagement;
