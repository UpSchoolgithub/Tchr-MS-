import React, { useState } from 'react';
import axios from 'axios';

const MViewTeachers = ({ teachers }) => {
  const [timetable, setTimetable] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const handleViewTimetable = async (teacherId, teacherName) => {
    try {
      // Call the API to fetch the timetable for the selected teacher
      const response = await axios.get(`/api/teachers/${teacherId}/timetable`);
      setTimetable(response.data); // Store the timetable data in state
      setSelectedTeacher(teacherName); // Store the teacher’s name for display
    } catch (error) {
      console.error('Error fetching timetable:', error);
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
    </div>
  );
};

export default MViewTeachers;
