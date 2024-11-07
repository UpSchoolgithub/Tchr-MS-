// src/components/StudentPersonalDetails.js
import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './StudentPersonalDetails.css';

const StudentPersonalDetails = ({ schoolId, classId, sectionId }) => { // Receive props here
  const [studentData, setStudentData] = useState([]); // State to store parsed student data

  // Handle Excel file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setStudentData(jsonData); // Store parsed data in state
      uploadData(jsonData); // Send data to backend
    };

    reader.readAsArrayBuffer(file);
  };

  // Send student data to the backend
  const uploadData = async (data) => {
    try {
      // Use sectionId in the API URL
      const response = await axios.post(`/api/sections/${sectionId}/students`, { students: data });
      console.log(response.data);
      alert('Student data uploaded successfully!');
    } catch (error) {
      console.error('Error uploading student data:', error);
      alert('Failed to upload student data.');
    }
  };

  // Render student data in a table
  const renderStudentTable = () => {
    return (
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
              <td>{student['Roll Number']}</td>
              <td>{student['Student Name']}</td>
              <td>{student['Student Email']}</td>
              <td>{student['Student Phone Number']}</td>
              <td>{student['Parent Name']}</td>
              <td>{student['Parent Phone Number 1']}</td>
              <td>{student['Parent Phone Number 2 (optional)']}</td>
              <td>{student['Parent Email']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="student-personal-details">
      <h3>Student Personal Details</h3>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="upload-button"
      />
      {studentData.length > 0 ? renderStudentTable() : <p>No data available. Please upload an Excel file.</p>}
    </div>
  );
};

export default StudentPersonalDetails;
