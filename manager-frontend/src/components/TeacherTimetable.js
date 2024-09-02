import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

const TeacherTimetable = () => {
  const { teacherId } = useParams();
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        // Corrected the URL by removing the extra '/api' part
        const response = await axiosInstance.get(`/timetable/teachers/${teacherId}/timetable`);
        setTimetable(response.data);
      } catch (err) {
        setError('Failed to load timetable');
        console.error('Error fetching timetable:', err);
      }
    };

    fetchTimetable();
  }, [teacherId]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (timetable.length === 0) {
    return <div>No timetable entries found.</div>;
  }

  return (
    <div>
      <h2>Teacher Timetable</h2>
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
            <th>Start Time</th>
            <th>End Time</th>
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
              <td>{entry.startTime || 'N/A'}</td>
              <td>{entry.endTime || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherTimetable;
