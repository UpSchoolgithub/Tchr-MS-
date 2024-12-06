import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const SessionManagement = () => {
  const { schoolId, classId, sectionId, subjectId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingNumberOfSessions, setEditingNumberOfSessions] = useState('');
  const [editingPriorityNumber, setEditingPriorityNumber] = useState('');
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  // Fetch metadata (e.g., board, class name, section name, subject name)
  const fetchClassDetails = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/details`
      );
      setClassDetails(response.data);
    } catch (error) {
      console.error('Error fetching class details:', error);
      setError('Failed to fetch class details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sessions for the given school, class, section, and subject
  const fetchSessions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const url = `https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions`;
      console.log("Fetching sessions from URL:", url);
      const response = await axios.get(url);
      console.log("Sessions response:", response.data);
      setSessions(response.data);
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
      setSelectedSessionIds([]); // Clear selection after successful deletion
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

  const isSelected = (sessionId) => selectedSessionIds.includes(sessionId);

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
      console.log("Uploading to URL:", uploadUrl);
      console.log("File:", file);

      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Upload response:', response.data);
      fetchSessions(); // Refresh session data after successful upload
    } catch (error) {
      console.error('Error uploading file:', error.response ? error.response.data : error.message);
      setError(error.response?.data?.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // View LP

  const handleViewLessonPlan = async (sessionId, topic) => {
    try {
      // Prepare the payload for the API request
      const payload = {
        board: "CBSE", // Replace with the actual value
        grade: "10", // Replace with the actual value
        subject: "Math", // Replace with the actual value
        subSubject: "Algebra", // Replace with the actual value
        unit: "Linear Equations", // Replace with the actual value
        chapter: topic.topic, // Topic name
        topics: [
          {
            topic: topic.topic,
            concepts: topic.concepts, // Concepts for the topic
          },
        ],
        sessionType: "Theory", // Hardcoded for now
        noOfSession: 1, // For single topic
        duration: 45, // Set a default duration
      };
  
      console.log("Fetching Lesson Plan with payload:", payload);
  
      const response = await axios.post(
        `https://tms.up.school/api/dynamicLP`,
        payload
      );
  
      // Handle response
      const lessonPlan = response.data.lesson_plan;
      console.log("Lesson Plan:", lessonPlan);
  
      // Update state to display the lesson plan
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === sessionId
            ? { ...session, lessonPlan } // Add the fetched lesson plan to the session
            : session
        )
      );
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      setError("Failed to fetch the lesson plan. Please try again.");
    }
  };
  
  return (
    <div>
      <h2>Session Management</h2>
      {error && <div className="error">{error}</div>}
      {isLoading && <p>Loading...</p>}

{/* Display metadata at the top */}
<div className="metadata">
        <p><strong>Board:</strong> {classDetails.board || 'N/A'}</p>
        <p><strong>Board ID:</strong> {classDetails.boardId || 'N/A'}</p>
        <p><strong>Class:</strong> {classDetails.className || 'N/A'}</p>
        <p><strong>Class ID:</strong> {classDetails.classId || classId}</p>
        <p><strong>Section Name:</strong> {classDetails.sectionName || 'N/A'}</p>
        <p><strong>Section ID:</strong> {classDetails.sectionId || sectionId}</p>
        <p><strong>Subject Name:</strong> {classDetails.subjectName || 'N/A'}</p>
        <p><strong>Subject ID:</strong> {classDetails.subjectId || subjectId}</p>
      </div>
      
      <form onSubmit={handleFileUpload}>
        <input type="file" name="file" accept=".xlsx, .xls" required />
        <button type="submit">Upload</button>
      </form>

      <button onClick={handleBulkDelete} disabled={selectedSessionIds.length === 0}>
        Bulk Delete
      </button>

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
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>
                <input
                  type="checkbox"
                  checked={isSelected(session.id)}
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SessionManagement;
