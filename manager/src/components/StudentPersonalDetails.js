import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../services/axiosInstance';
import './StudentPersonalDetails.css';

const StudentPersonalDetails = ({ schoolId, classId, sectionId }) => {
  const [studentData, setStudentData] = useState([]); // Existing data
  const [file, setFile] = useState(null); // Uploaded file
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
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      setFeedbackMessage('No file selected.');
      setIsSuccess(false);
      return;
    }
    setFile(selectedFile);
    setFeedbackMessage('File selected. Ready to upload.');
    setIsSuccess(true);
  };

  // Upload file to the backend
  const uploadStudentData = async () => {
    if (!file) {
      setFeedbackMessage('No file to upload. Please select a file.');
      setIsSuccess(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // Attach the actual file object

    try {
      const response = await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setFeedbackMessage(response.data.message || 'Student data uploaded successfully!');
      setIsSuccess(true);
      fetchStudentData(); // Refresh the existing data after upload
      setFile(null); // Clear file input after successful upload
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
            <td>{student.parentPhoneNumber2 || '-'}</td>
            <td>{student.parentEmail || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="student-personal-details">
      <h3>Student Personal Details</h3>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="upload-button" />
      {feedbackMessage && <p style={{ color: isSuccess ? 'green' : 'red' }}>{feedbackMessage}</p>}

      <button onClick={uploadStudentData} className="upload-button">
        Confirm and Upload Data
      </button>

      <h4>Existing Student List</h4>
      {studentData.length > 0 ? renderStudentTable(studentData) : <p>No student data available.</p>}
    </div>
  );
};

export default StudentPersonalDetails;
