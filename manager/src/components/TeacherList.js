import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useNavigate } from 'react-router-dom';
import './TeacherList.css';
import jwt_decode from 'jwt-decode'; // Corrected import statement

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to validate JWT token
  const validateToken = (token) => {
    if (!token) return { valid: false, error: 'No authorization token found. Please log in.' };

    try {
      const decodedToken = jwt_decode(token); // Use jwt_decode directly
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < currentTime) {
        return { valid: false, error: 'Session expired. Please log in again.' };
      }
      return { valid: true, decodedToken };
    } catch (error) {
      return { valid: false, error: 'Failed to decode token. Please try again.' };
    }
  };

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

  const handleViewTimetable = async (teacherId, teacherName) => {
    setLoading(true);
    setError(null);
    setSelectedTeacher(teacherName);

    const token = localStorage.getItem('authToken');
    const validation = validateToken(token);
    if (!validation.valid) {
      setError(validation.error);
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/timetable`);
      setTimetable(response.data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setError('Could not fetch the timetable. Please try again later.');
    } finally {
      setLoading(false);
    }
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
            <th>Timetable</th>
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
              </td>
              <td>
                <button className="view-button" onClick={() => handleViewTimetable(teacher.id, teacher.name)}>Timetable</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedTeacher && (
        <div className="teacher-timetable">
          <h2>Timetable for {selectedTeacher}</h2>
          
          {loading ? (
            <p>Loading timetable...</p>
          ) : error ? (
            <div>
              <p className="error-message">{error}</p>
              <button className="retry-button" onClick={() => handleViewTimetable(selectedTeacher.id, selectedTeacher.name)}>
                Retry
              </button>
            </div>
          ) : timetable.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Period</th>
                  <th>Time</th>
                  <th>School</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.day}</td>
                    <td>{entry.period}</td>
                    <td>{`${entry.startTime} - ${entry.endTime}`}</td>
                    <td>{entry.schoolName || "N/A"}</td>
                    <td>{entry.className || "N/A"}</td>
                    <td>{entry.sectionName || "N/A"}</td>
                    <td>{entry.subjectName || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No timetable entries found for this teacher.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherList;
