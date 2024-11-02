import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useNavigate } from 'react-router-dom';
import './TeacherList.css';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
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
    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/timetable`);
      setTimetable(response.data);
      setSelectedTeacher(teacherName);
    } catch (error) {
      console.error('Error fetching timetable:', error);
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

      {/* Display the timetable for the selected teacher */}
      {selectedTeacher && timetable.length > 0 && (
        <div className="teacher-timetable">
          <h2>Timetable for {selectedTeacher}</h2>
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
                  <td>{entry.schoolName}</td>
                  <td>{entry.className}</td>
                  <td>{entry.sectionName}</td>
                  <td>{entry.subjectName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherList;
