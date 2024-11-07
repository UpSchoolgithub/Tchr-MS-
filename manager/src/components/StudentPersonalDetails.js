// src/components/StudentPersonalDetails.js
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../services/axiosInstance';
import './StudentPersonalDetails.css';

const StudentPersonalDetails = ({ schoolId, classId, sectionId }) => {
  const [studentData, setStudentData] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState(""); // For feedback messages
  const [isSuccess, setIsSuccess] = useState(false); // For success state

  // Fetch student data from the backend
  const fetchStudentData = async () => {
    try {
      console.log(`Fetching data for schoolId: ${schoolId}, classId: ${classId}, sectionId: ${sectionId}`);
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`);
      console.log('Fetched student data:', response.data); // Log the fetched data
      setStudentData(response.data);
    } catch (error) {
      console.error('Error fetching student data:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [schoolId, classId, sectionId]);

  // Handle Excel file upload and parse data
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error('No file selected.');
      return;
    }
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet).map(row => ({
          rollNumber: row['Roll Number'],
          studentName: row['Student Name'],
          studentEmail: row['Student Email'],
          studentPhoneNumber: row['Student Phone Number'],
          parentName: row['Parent Name'],
          parentPhoneNumber1: row['Parent Phone Number 1'],
          parentPhoneNumber2: row['Parent Phone Number 2 (optional)'],
          parentEmail: row['Parent Email'],
        }));

        setStudentData(jsonData); // Store parsed data in state
        setFeedbackMessage("File parsed successfully! Ready to upload."); // Feedback message
        setIsSuccess(true);
        console.log('Parsed student data:', jsonData); // For debugging
      } catch (parseError) {
        console.error('Error parsing Excel file:', parseError);
        setFeedbackMessage("Error parsing the Excel file."); // Feedback message
        setIsSuccess(false);
      }
    };

    reader.onerror = (readError) => {
      console.error('Error reading file:', readError);
      setFeedbackMessage("Error reading the file."); // Feedback message
      setIsSuccess(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Upload student data to the backend
  const uploadStudentData = async () => {
    if (studentData.length === 0) {
      console.error('No student data to upload.');
      setFeedbackMessage('No student data to upload.'); // Feedback message
      setIsSuccess(false);
      return;
    }

    try {
      console.log('Uploading student data:', studentData);
      await axiosInstance.post(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`, {
        students: studentData,
      });
      setFeedbackMessage('Student data uploaded successfully!'); // Success message
      setIsSuccess(true);
      fetchStudentData(); // Fetch updated data to reflect the changes
    } catch (error) {
      const errorMsg = error.response ? error.response.data : error.message;
      console.error('Error uploading student data:', errorMsg);
      setFeedbackMessage(`Failed to upload student data: ${errorMsg}`); // Error message
      setIsSuccess(false);
    }
  };

  // Render student data in a table
  const renderStudentTable = () => (
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
        {studentData.map((student, index) => (
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
      {feedbackMessage && (
        <p style={{ color: isSuccess ? 'green' : 'red' }}>{feedbackMessage}</p> // Display feedback message
      )}
      {studentData.length > 0 ? (
        <>
          {renderStudentTable()}
          <button onClick={uploadStudentData} className="upload-button">
            Upload Student Data
          </button>
        </>
      ) : (
        <p>No data available. Please upload an Excel file.</p>
      )}
    </div>
  );
};

export default StudentPersonalDetails;
