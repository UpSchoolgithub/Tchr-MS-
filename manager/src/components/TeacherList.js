import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useNavigate } from 'react-router-dom';
import './TeacherList.css';
import jwt_decode from 'jwt-decode';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state for fetching timetable
  const [error, setError] = useState(null); // Error state for handling fetch errors
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

  const handleViewTimetable = async (teacherId, teacherName) => {
    setLoading(true);
    setError(null);
    setSelectedTeacher(teacherName);
  
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken = jwt_decode(token);  // Correct function call
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken.exp < currentTime) {
          console.error("Token has expired");
          setError('Session expired. Please log in again.');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setError('Failed to decode token. Please try again.');
        setLoading(false);
        return;
      }
    } else {
      console.error("No token found in localStorage");
      setError('No authorization token found. Please log in.');
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

      {/* Display the timetable or error/loading messages for the selected teacher */}
      {selectedTeacher && (
        <div className="teacher-timetable">
          <h2>Timetable for {selectedTeacher}</h2>
          
          {loading ? (
            <p>Loading timetable...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
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
