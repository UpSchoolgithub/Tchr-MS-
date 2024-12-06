import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation, Link } from 'react-router-dom';

const SessionManagement = () => {
  const { schoolId, classId, sectionId, subjectId } = useParams();
  const location = useLocation();
  const [sessions, setSessions] = useState([]); // Initialize as an empty array
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingNumberOfSessions, setEditingNumberOfSessions] = useState('');
  const [editingPriorityNumber, setEditingPriorityNumber] = useState('');
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Extract additional data passed via Link state or props
  const {
    className = 'Class Name Not Available',
    schoolName = 'School Name Not Available',
    subjectName = 'Subject Name Not Available',
    sectionName = 'Section Name Not Available',
    board = 'Board Not Available',
  } = location.state || {};

  // Fetch sessions for the given school, class, section, and subject
  const fetchSessions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const url = `https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions`;
      const response = await axios.get(url);

      // Ensure response is an array; fallback to an empty array
      const fetchedSessions = response.data.sessions || [];
      if (!Array.isArray(fetchedSessions)) {
        throw new Error('Invalid data format: sessions is not an array');
      }

      setSessions(fetchedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to fetch sessions. Please try again later.');
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
      await axios.put(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`, {
        numberOfSessions: editingNumberOfSessions,
        priorityNumber: editingPriorityNumber,
      });
      setEditingSessionId(null);
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      setError('Failed to update session. Please check your input and try again.');
    }
  };

  const handleSessionDelete = async (sessionId) => {
    try {
      await axios.delete(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`);
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session. Please try again later.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessionIds.length === 0) {
      setError('Please select at least one session to delete.');
      return;
    }

    try {
      await axios.post(`/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/bulk-delete`, {
        sessionIds: selectedSessionIds,
      });
      setSelectedSessionIds([]);
      fetchSessions();
    } catch (error) {
      console.error('Error deleting sessions:', error);
      setError('Failed to delete sessions. Please try again later.');
    }
  };

  const toggleSelection = (sessionId) => {
    setSelectedSessionIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
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
    setError('');

    try {
      const uploadUrl = `https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions/upload`;
      await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchSessions();
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetails = async () => {
    try {
      const url = `https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}`;
      const response = await axios.get(url);
  
      // Fallback to update state variables if missing
      setStateValues({
        schoolName: response.data.schoolName || 'School Name Not Available',
        className: response.data.className || 'Class Name Not Available',
        sectionName: response.data.sectionName || 'Section Name Not Available',
        subjectName: response.data.subjectName || 'Subject Name Not Available',
        board: response.data.board || 'Board Not Available',
      });
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };
  const [stateValues, setStateValues] = useState({
    schoolName: 'School Name Not Available',
    className: 'Class Name Not Available',
    sectionName: 'Section Name Not Available',
    subjectName: 'Subject Name Not Available',
    board: 'Board Not Available',
  });
  
  return (
    <div>
      <h2>Session Management</h2>
      {error && <div className="error">{error}</div>}
      {isLoading && <p>Loading...</p>}

      {/* Information Banner */}
      <div className="info-banner">
        <p><strong>School Name:</strong> {schoolName} | <strong>School ID:</strong> {schoolId}</p>
        <p><strong>Class Name:</strong> {className} | <strong>Class ID:</strong> {classId}</p>
        <p><strong>Section Name:</strong> {sectionName} | <strong>Section ID:</strong> {sectionId}</p>
        <p><strong>Subject Name:</strong> {subjectName} | <strong>Subject ID:</strong> {subjectId}</p>
        <p><strong>Board:</strong> {board}</p>
      </div>

      {/* File Upload */}
      <form onSubmit={handleFileUpload}>
        <input type="file" name="file" accept=".xlsx, .xls" required />
        <button type="submit">Upload</button>
      </form>

      {/* Bulk Delete */}
      <button onClick={handleBulkDelete} disabled={selectedSessionIds.length === 0}>
        Bulk Delete
      </button>

      {/* Session Table */}
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={(e) =>
                  setSelectedSessionIds(
                    e.target.checked ? sessions.map((session) => session.id) : []
                  )
                }
                checked={selectedSessionIds.length === sessions.length && sessions.length > 0}
              />
            </th>
            <th>Unit Name</th>
            <th>Chapter</th>
            <th>Number of Sessions</th>
            <th>Priority Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(sessions) && sessions.length > 0 ? (
            sessions.map((session) => (
              <tr key={session.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSessionIds.includes(session.id)}
                    onChange={() => toggleSelection(session.id)}
                  />
                </td>
                <td>{session.unitName || 'N/A'}</td>
                <td>{session.chapterName || 'N/A'}</td>
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
              <td colSpan="6">No sessions available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SessionManagement;
