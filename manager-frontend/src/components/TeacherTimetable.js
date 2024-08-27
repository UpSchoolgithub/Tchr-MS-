import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

const TeacherTimetable = () => {
  const { teacherId } = useParams();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await axiosInstance.get(`/teachers/${teacherId}/timetable`);
        setTimetable(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching timetable:', error);
        setError('Failed to load timetable');
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [teacherId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="teacher-timetable">
      <h1>Teacher's Timetable</h1>
      {timetable.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Day</th>
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
                <td>{entry.time}</td>
                <td>{entry.schoolName}</td>
                <td>{entry.className}</td>
                <td>{entry.sectionName}</td>
                <td>{entry.subjectName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No timetable available</div>
      )}
    </div>
  );
};

export default TeacherTimetable;
