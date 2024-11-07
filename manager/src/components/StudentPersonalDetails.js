// src/components/StudentPersonalDetails.js
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../services/axiosInstance';
import './StudentPersonalDetails.css';

const StudentPersonalDetails = ({ sectionId }) => {
  const [studentData, setStudentData] = useState([]); // State to store student data

  // Fetch existing student data when component loads
    useEffect(() => {
        const fetchStudentData = async () => {
          try {
            const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`);
            setStudentData(response.data);
          } catch (error) {
            console.error('Error fetching student data:', error);
          }
        };
    
        fetchStudentData();
    }, [schoolId, classId, sectionId]);
    

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
      console.log(jsonData); // For debugging
    };

    reader.readAsArrayBuffer(file);
  };

  // Upload student data to the backend
  const uploadStudentData = async () => {
    try {
      await axiosInstance.post(`/sections/${sectionId}/students`, {
        students: studentData,
      });
      alert('Student data uploaded successfully');
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
            <td>{student.rollNumber || student['Roll Number']}</td>
            <td>{student.name || student['Student Name']}</td>
            <td>{student.studentEmail || student['Student Email']}</td>
            <td>{student.studentPhoneNumber || student['Student Phone Number']}</td>
            <td>{student.parentName || student['Parent Name']}</td>
            <td>{student.parentPhoneNumber1 || student['Parent Phone Number 1']}</td>
            <td>{student.parentPhoneNumber2 || student['Parent Phone Number 2 (optional)']}</td>
            <td>{student.parentEmail || student['Parent Email']}</td>
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
