import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../services/axiosInstance';
import './Student.css';

const Student = ({ schoolId, classId, sectionId }) => {
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudentData, setNewStudentData] = useState({
    rollNumber: '',
    studentName: '',
    studentEmail: '',
    studentPhoneNumber: '',
    parentName: '',
    parentPhoneNumber1: '',
    parentPhoneNumber2: '',
    parentEmail: ''
  });
  const [parsedFile, setParsedFile] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch students from the backend
  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setFeedbackMessage('Error fetching student data');
      setIsSuccess(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [schoolId, classId, sectionId]);

  const handleFileUpload = async () => {
    if (!parsedFile) {
      setFeedbackMessage('No file selected.');
      setIsSuccess(false);
      return;
    }
};

  const uploadStudentData = async () => {
    if (!parsedFile) {
      setFeedbackMessage('No file selected.');
      setIsSuccess(false);
      return;
    }

    const formData = new FormData();
  formData.append('file', parsedFile);

  try {
    const response = await axiosInstance.post(
      `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // Adjust as needed
        },
      }
    );

    setFeedbackMessage(response.data.message || 'Students uploaded successfully!');
    setIsSuccess(true);
    fetchStudents(); // Refresh the list of students after upload
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    setFeedbackMessage(`Failed to upload student data: ${errorMsg}`);
    setIsSuccess(false);
    console.error("Upload Error:", error);
  }
};

const addStudentManually = async () => {
    try {
      const response = await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students/manual`,
        newStudentData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
  
      setFeedbackMessage(response.data.message || 'Student added successfully!');
      setIsSuccess(true);
      fetchStudents(); // Refresh the list of students after adding manually
      setNewStudentData(initialStudentData); // Clear form fields
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setFeedbackMessage(`Failed to add student: ${errorMsg}`);
      setIsSuccess(false);
      console.error("Add Error:", error);
    }
  };
  

  return (
    <div className="student-management">
      <h3>Student Management</h3>

      {/* File Upload */}
      <div className="file-upload">
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        <button onClick={uploadStudentData}>Upload Students</button>
      </div>
      
      {/* Manual Student Entry */}
      <h4>Or Add Student Manually</h4>
      <div className="manual-entry-form">
        <label>
          Roll Number:
          <input type="number" value={newStudentData.rollNumber} onChange={(e) => setNewStudentData({ ...newStudentData, rollNumber: e.target.value })} />
        </label>
        <label>
          Student Name:
          <input type="text" value={newStudentData.studentName} onChange={(e) => setNewStudentData({ ...newStudentData, studentName: e.target.value })} />
        </label>
        <label>
          Email:
          <input type="email" value={newStudentData.studentEmail} onChange={(e) => setNewStudentData({ ...newStudentData, studentEmail: e.target.value })} />
        </label>
        <label>
          Phone Number:
          <input type="text" value={newStudentData.studentPhoneNumber} onChange={(e) => setNewStudentData({ ...newStudentData, studentPhoneNumber: e.target.value })} />
        </label>
        <label>
          Parent Name:
          <input type="text" value={newStudentData.parentName} onChange={(e) => setNewStudentData({ ...newStudentData, parentName: e.target.value })} />
        </label>
        <label>
          Parent Phone Number 1:
          <input type="text" value={newStudentData.parentPhoneNumber1} onChange={(e) => setNewStudentData({ ...newStudentData, parentPhoneNumber1: e.target.value })} />
        </label>
        <label>
          Parent Phone Number 2 (optional):
          <input type="text" value={newStudentData.parentPhoneNumber2} onChange={(e) => setNewStudentData({ ...newStudentData, parentPhoneNumber2: e.target.value })} />
        </label>
        <label>
          Parent Email:
          <input type="email" value={newStudentData.parentEmail} onChange={(e) => setNewStudentData({ ...newStudentData, parentEmail: e.target.value })} />
        </label>
        <button onClick={addStudentManually}>Add Student</button>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <p className={`feedback-message ${isSuccess ? 'success' : 'error'}`}>
          {feedbackMessage}
        </p>
      )}

      {/* Students Table */}
      <h4>Existing Student List</h4>
      {students.length > 0 ? (
        <table className="student-table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Parent Name</th>
              <th>Parent Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id}>
                <td>{student.rollNumber}</td>
                <td>{student.studentName}</td>
                <td>{student.studentEmail}</td>
                <td>{student.studentPhoneNumber}</td>
                <td>{student.parentName}</td>
                <td>{student.parentPhoneNumber1}</td>
                <td>
                  <button onClick={() => setEditingStudent(student)}>Edit</button>
                  <button onClick={() => handleDelete(student.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No student data available.</p>
      )}
    </div>
  );
};

export default Student;
