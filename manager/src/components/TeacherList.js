import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useNavigate } from 'react-router-dom';
import './TeacherList.css';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const navigate = useNavigate();

  const fetchTeachers = async () => {
    try {
      const response = await axiosInstance.get('/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
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

  const handleViewTimetable = (teacherId) => {
    navigate(`/schools/timetable/teacher/${teacherId}`);
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
                <button className="view-button" onClick={() => handleViewTimetable(teacher.id)}>View Timetable</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherList;
