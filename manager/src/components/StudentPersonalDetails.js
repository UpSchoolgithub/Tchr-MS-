import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../services/axiosInstance';
import './StudentPersonalDetails.css';

const StudentPersonalDetails = ({ schoolId, classId, sectionId }) => {
  const [studentData, setStudentData] = useState([]); // Existing data
  const [file, setFile] = useState(null); // File for upload
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch student data from the backend
  const fetchStudentData = async () => {
    try {
      const response = await axiosInstance.get(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`
      );
      setStudentData(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('No students found for this section');
        setStudentData([]); // Set an empty array if no students found
      } else {
        console.error('Error fetching student data:', error.response ? error.response.data : error.message);
      }
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [schoolId, classId, sectionId]);

  // Handle Excel file selection
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile); // Store the file for upload
    setFeedbackMessage('File selected. Ready for upload.');
    setIsSuccess(true);
  };

  // Upload selected file to the backend
  const uploadStudentData = async () => {
    if (!file) {
      setFeedbackMessage('No file selected for upload.');
      setIsSuccess(false);
      return;
    }
  
    try {
      // Create FormData object and append the file
      const formData = new FormData();
      formData.append('file', file); // Ensure key is "file"
  
      const response = await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      setFeedbackMessage(response.data.message || 'Student data uploaded successfully!');
      setIsSuccess(true);
      fetchStudentData(); // Refresh existing data
      setFile(null); // Clear the file after upload
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setFeedbackMessage(`Failed to upload student data: ${errorMsg}`);
      setIsSuccess(false);
      console.error('Upload Error:', error);
    }
  };
  

  // Render student data in a table
  const renderStudentTable = (data) => (
    <table className="student-table">
      <thead>
        <tr>
          <th>Roll Number</th>
          <th>Student Name</th>
          <th>Student Email</th>
          <th>Student Phone Number</th>
          <th>Parent Name</th>
          <th>Parent Phone Number 1</th>
          <th>Parent Phone Number 2 (optional)</th>
          <th>Parent Email</th>
        </tr>
      </thead>
      <tbody>
        {data.map((student, index) => (
          <tr key={index}>
            <td>{student.rollNumber}</td>
            <td>{student.studentName}</td>
            <td>{student.studentEmail}</td>
            <td>{student.studentPhoneNumber}</td>
            <td>{student.parentName}</td>
            <td>{student.parentPhoneNumber1}</td>
            <td>{student.parentPhoneNumber2}</td>
            <td>{student.parentEmail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="student-personal-details">
      <h3>Student Personal Details</h3>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="upload-button"
      />
      {feedbackMessage && <p style={{ color: isSuccess ? 'green' : 'red' }}>{feedbackMessage}</p>}
      {file && (
        <button onClick={uploadStudentData} className="upload-button">
          Upload File
        </button>
      )}

      <h4>Existing Student List</h4>
      {studentData.length > 0 ? renderStudentTable(studentData) : <p>No student data available.</p>}
    </div>
  );
};

export default StudentPersonalDetails;
