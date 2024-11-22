import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

const UpdateAssignment = () => {
  const { state } = useLocation();
  const { sessionId, sessionNumber, chapterName, sessionDate, assignmentDetails: existingDetails } = state || {};

  const [assignmentDetails, setAssignmentDetails] = useState(existingDetails || '');
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('assignmentDetails', assignmentDetails);
    if (file) {
      formData.append('file', file);
    }

    try {
      await axiosInstance.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Assignment updated successfully!');
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment.');
    }
  };

  return (
    <div>
      <h2>Update Assignment</h2>
      <p><strong>Session Date:</strong> {sessionDate}</p>
      <p><strong>Session Number:</strong> {sessionNumber}</p>
      <p><strong>Chapter:</strong> {chapterName}</p>

      <label>
        Assignments:
        <textarea
          value={assignmentDetails}
          onChange={(e) => setAssignmentDetails(e.target.value)}
          placeholder="Enter assignment details..."
        />
      </label>

      <label>
        Upload File:
        <input type="file" onChange={handleFileChange} />
      </label>

      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default UpdateAssignment;
