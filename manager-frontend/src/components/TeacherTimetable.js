import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Importing axios for API calls
import './TeacherTimetable.css'; // Import your custom CSS for styling

const TeacherTimetable = ({ teacherId }) => {
  const [timetableData, setTimetableData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/timetable/teacher/${teacherId}`); // Adjust the endpoint based on your backend
        setTimetableData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching timetable data.');
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [teacherId]);

  const renderTimetable = () => {
    if (loading) {
      return <p>Loading...</p>;
    }

    if (error) {
      return <p>{error}</p>;
    }

    if (!timetableData.length) {
      return <p>No periods assigned for this teacher.</p>;
    }

    // Create a days array for a consistent display order
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Create a mapping of day to periods for easy rendering
    const timetableByDay = days.reduce((acc, day) => {
      acc[day] = timetableData.filter(entry => entry.day === day);
      return acc;
    }, {});

    return (
      <table className="timetable-table">
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
          {days.map(day => (
            timetableByDay[day].length > 0 ? (
              timetableByDay[day].map((entry, index) => (
                <tr key={entry.id}>
                  {index === 0 && (
                    <td rowSpan={timetableByDay[day].length}>{day}</td>
                  )}
                  <td>{entry.time}</td>
                  <td>{entry.schoolName}</td>
                  <td>{entry.className}</td>
                  <td>{entry.combinedSectionId}</td>
                  <td>{entry.subjectName}</td>
                </tr>
              ))
            ) : (
              <tr key={day}>
                <td>{day}</td>
                <td colSpan="6">No periods assigned</td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="teacher-timetable-container">
      <h2>Teacher Timetable</h2>
      {renderTimetable()}
    </div>
  );
};

export default TeacherTimetable;
