import React, { useState } from 'react';
import axios from 'axios';

const MViewTeachers = ({ teachers }) => {
  const [timetable, setTimetable] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleViewTimetable = async (teacherId, teacherName) => {
    setLoading(true); 
    setError(''); 
    setSelectedTeacher(teacherName); 

    try {
      const response = await axios.get(`/api/teachers/${teacherId}/timetable`);
      setTimetable(response.data); 
    } catch (err) {
      setError('Error fetching timetable'); 
      console.error('Error fetching timetable:', err);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="view-teachers">
      <h1>Teachers</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id}>
              <td>{teacher.name}</td>
              <td>
                <button onClick={() => handleViewTimetable(teacher.id, teacher.name)}>
                  View Timetable
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loading && <p>Loading timetable...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

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
                  <td>{entry.startTime} - {entry.endTime}</td>
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

      {selectedTeacher && !loading && timetable.length === 0 && !error && (
        <p>No timetable entries found for {selectedTeacher}.</p>
      )}
    </div>
  );
};

export default MViewTeachers;
