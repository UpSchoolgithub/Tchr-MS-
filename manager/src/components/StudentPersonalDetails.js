// src/components/StudentPersonalDetails.js
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../services/axiosInstance';
import './StudentPersonalDetails.css';

const StudentPersonalDetails = ({ schoolId, classId, sectionId }) => {
  const [studentData, setStudentData] = useState([]);

  // Fetch student data from the backend
  const fetchStudentData = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`);
      console.log('Fetched student data:', response.data); // Log the fetched data
      setStudentData(response.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [schoolId, classId, sectionId]);

  // Handle Excel file upload and parse data
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
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
      console.log('Parsed student data:', jsonData); // For debugging
    };

    reader.readAsArrayBuffer(file);
  };

  // Upload student data to the backend
  const uploadStudentData = async () => {
    try {
      await axiosInstance.post(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`, {
        students: studentData,
      });
      alert('Student data uploaded successfully');
      // Fetch updated data to reflect the changes
      fetchStudentData();
    } catch (error) {
      console.error('Error uploading student data:', error);
      alert('Failed to upload student data');
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
