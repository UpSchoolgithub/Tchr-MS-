import React, { useState } from 'react';
import axios from 'axios';

const MViewTeachers = ({ teachers }) => {
  const [timetable, setTimetable] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleViewTimetable = async (teacherId, teacherName) => {
    setLoading(true); // Start loading
    setError(null); // Reset any previous errors
    try {
      // Call the API to fetch the timetable for the selected teacher
      const response = await axios.get(`/api/teachers/${teacherId}/timetable`);
      setTimetable(response.data); // Store the timetable data in state
      setSelectedTeacher(teacherName); // Store the teacher’s name for display
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setError('Failed to fetch timetable'); // Set error message
    } finally {
      setLoading(false); // End loading
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

      {/* Loading, Error, and Timetable Display */}
      {loading && <p>Loading timetable...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

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
                  <td>{entry.time}</td>
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

      {/* Message if no timetable entries found */}
      {selectedTeacher && timetable.length === 0 && !loading && !error && (
        <p>No timetable entries found for {selectedTeacher}.</p>
      )}
    </div>
  );
};

export default MViewTeachers;
