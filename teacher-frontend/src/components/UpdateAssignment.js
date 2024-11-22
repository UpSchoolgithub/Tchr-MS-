import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './UpdateAssignment.css';

const UpdateAssignment = () => {
  const { state } = useLocation();
  const { teacherId, sessionId, sessionDate, sessionNumber, chapterName } = state || {};

  const [assignmentDetails, setAssignmentDetails] = useState('');
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSaveAssignment = async () => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('assignmentDetails', assignmentDetails);
    if (file) formData.append('file', file);

    try {
      const response = await axiosInstance.post('/assignments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Assignment updated successfully!');
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment.');
    }
  };

  return (
    <div className="update-assignment-container">
      <h2>Update Assignment</h2>
      <p><strong>Session Date:</strong> {sessionDate}</p>
      <p><strong>Session Number:</strong> {sessionNumber}</p>
      <p><strong>Chapter:</strong> {chapterName}</p>

      <div className="assignment-details">
        <label htmlFor="assignmentDetails">Assignment Details:</label>
        <textarea
          id="assignmentDetails"
          value={assignmentDetails}
          onChange={(e) => setAssignmentDetails(e.target.value)}
          placeholder="Enter assignment details here..."
        ></textarea>
      </div>

      <div className="assignment-file-upload">
        <label htmlFor="fileUpload">Upload File:</label>
        <input type="file" id="fileUpload" onChange={handleFileChange} />
      </div>

      <button onClick={handleSaveAssignment} style={{ backgroundColor: 'orange', color: 'black' }}>
        Submit
      </button>
    </div>
  );
};

export default UpdateAssignment;
