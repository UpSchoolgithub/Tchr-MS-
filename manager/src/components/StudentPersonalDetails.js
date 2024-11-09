import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../services/axiosInstance';
import './StudentPersonalDetails.css';

const StudentPersonalDetails = ({ schoolId, classId, sectionId }) => {
  const [studentData, setStudentData] = useState([]); // Existing data
  const [parsedData, setParsedData] = useState([]); // Newly parsed data
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch student data from the backend
  const fetchStudentData = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`);
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

  // Handle Excel file upload and parse data
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

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

        setParsedData(jsonData); // Store parsed data separately
        setFeedbackMessage("File parsed successfully! Review data below before uploading.");
        setIsSuccess(true);
      } catch (parseError) {
        console.error('Error parsing Excel file:', parseError);
        setFeedbackMessage("Error parsing the Excel file.");
        setIsSuccess(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Upload parsed student data to the backend
  const uploadStudentData = async () => {
    if (parsedData.length === 0) {
      setFeedbackMessage('No student data to upload.');
      setIsSuccess(false);
      return;
    }

    try {
      await axiosInstance.post(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`, { students: parsedData });
      setFeedbackMessage('Student data uploaded successfully!');
      setIsSuccess(true);
      fetchStudentData(); // Refresh existing data
      setParsedData([]); // Clear parsed data after upload
    } catch (error) {
      const errorMsg = error.response ? error.response.data : error.message;
      setFeedbackMessage(`Failed to upload student data: ${errorMsg}`);
      setIsSuccess(false);
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
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="upload-button" />
      {feedbackMessage && <p style={{ color: isSuccess ? 'green' : 'red' }}>{feedbackMessage}</p>}
      
      {parsedData.length > 0 && (
        <>
          <h4>Preview Parsed Data</h4>
          {renderStudentTable(parsedData)}
          <button onClick={uploadStudentData} className="upload-button">
            Confirm and Upload Data
          </button>
        </>
      )}

      <h4>Existing Student List</h4>
      {studentData.length > 0 ? renderStudentTable(studentData) : <p>No student data available.</p>}
    </div>
  );
};

export default StudentPersonalDetails;
