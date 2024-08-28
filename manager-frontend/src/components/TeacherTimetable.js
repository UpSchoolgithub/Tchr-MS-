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
        const response = await axiosInstance.get(`/api/teachers/${teacherId}/timetable`);
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

  return (
    <div>
      <h2>Teacher Timetable</h2>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Subject</th>
            <th>Class</th>
            <th>Section</th>
          </tr>
        </thead>
        <tbody>
          {timetable.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.day}</td>
              <td>{entry.time}</td>
              <td>{entry.subject}</td>
              <td>{entry.class}</td>
              <td>{entry.section}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherTimetable;
