import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useNavigate } from 'react-router-dom';
import './TeacherList.css';
import jwt_decode from 'jwt-decode';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const validateToken = (token) => {
    if (!token) return { valid: false, error: 'No authorization token found. Please log in.' };

    try {
      const decodedToken = jwt_decode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < currentTime) {
        return { valid: false, error: 'Session expired. Please log in again.' };
      }
      return { valid: true, decodedToken };
    } catch (error) {
      console.error("Error decoding token:", error);
      return { valid: false, error: 'Failed to decode token. Please try again.' };
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axiosInstance.get('/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError('Failed to load teachers.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/teachers/${id}`);
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const handleViewAssignments = (teacherId) => {
    navigate(`/teachers/${teacherId}/assignments`);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  return (
    <div className="teacher-list">
      <h1>Teachers</h1>
      <button className="create-button" onClick={() => navigate('/teachers/create')}>Create New Teacher</button>
      <table className="teacher-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Schools</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id}>
              <td>{teacher.name}</td>
              <td>{teacher.Schools.map((school) => school.name).join(', ')}</td>
              <td>
                <button className="edit-button" onClick={() => navigate(`/teachers/edit/${teacher.id}`)}>Edit</button>
                <button className="delete-button" onClick={() => handleDelete(teacher.id)}>Delete</button>
                <button className="view-assignments-button" onClick={() => handleViewAssignments(teacher.id)}>View Assignments</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default TeacherList;
