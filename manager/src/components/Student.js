import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../services/axiosInstance';
import './Student.css';

const Student = ({ schoolId, classId, sectionId }) => {
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudentData, setNewStudentData] = useState({});
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
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [schoolId, classId, sectionId]);

  // Handle Excel file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setParsedFile(file);
  };

  // Upload and save student data from the file
  const uploadStudentData = async () => {
    if (!parsedFile) {
      setFeedbackMessage('No file selected.');
      setIsSuccess(false);
      return;
    }
  
    // Create FormData and append the file to match Postman's format
    const formData = new FormData();
    formData.append('file', parsedFile);
  
    try {
      const response = await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setFeedbackMessage(response.data.message || 'Students uploaded successfully!');
      setIsSuccess(true);
      fetchStudents(); // Refresh data
      setParsedFile(null); // Clear selected file
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setFeedbackMessage(`Failed to upload student data: ${errorMsg}`);
      setIsSuccess(false);
      console.error("Upload Error:", error);
    }
  };
  

  // Handle edit and delete actions
  const handleEdit = (student) => {
    setEditingStudent(student);
    setNewStudentData({ ...student });
  };

  const handleDelete = async (studentId) => {
    try {
      await axiosInstance.delete(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students/${studentId}`);
      fetchStudents(); // Refresh data after deletion
      setFeedbackMessage('Student deleted successfully');
      setIsSuccess(true);
    } catch (error) {
      console.error('Error deleting student:', error);
      setFeedbackMessage('Error deleting student');
      setIsSuccess(false);
    }
  };

  const saveEdit = async () => {
    try {
      await axiosInstance.put(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students/${editingStudent.id}`, newStudentData);
      setFeedbackMessage('Student updated successfully');
      setIsSuccess(true);
      fetchStudents(); // Refresh data
      setEditingStudent(null); // Exit edit mode
    } catch (error) {
      console.error('Error updating student:', error);
      setFeedbackMessage('Error updating student');
      setIsSuccess(false);
    }
  };

  return (
    <div className="student-management">
      <h3>Student Management</h3>
      
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <button onClick={uploadStudentData}>Upload Students</button>
      {feedbackMessage && <p style={{ color: isSuccess ? 'green' : 'red' }}>{feedbackMessage}</p>}

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
                <button onClick={() => handleEdit(student)}>Edit</button>
                <button onClick={() => handleDelete(student.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingStudent && (
        <div className="edit-form">
          <h4>Edit Student</h4>
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
          <button onClick={saveEdit}>Save</button>
          <button onClick={() => setEditingStudent(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Student;
