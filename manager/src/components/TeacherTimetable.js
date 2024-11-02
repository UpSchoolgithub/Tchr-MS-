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
        const response = await axiosInstance.get(`/teachers/${teacherId}/timetable`);
        setTimetable(response.data);
      } catch (err) {
        setError('Failed to load timetable');
        console.error('Error fetching timetable:', err);
      }
    };

    fetchTimetable();
  }, [teacherId]);

  const formatTime = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const format = (time) => {
      const date = new Date(`1970-01-01T${time}`);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    return `${format(startTime)} - ${format(endTime)}`;
  };

  const groupedTimetable = timetable.reduce((acc, entry) => {
    if (!acc[entry.day]) acc[entry.day] = [];
    acc[entry.day].push(entry);
    return acc;
  }, {});

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <h2>Teacher Timetable</h2>
      {Object.keys(groupedTimetable).length === 0 ? (
        <div>No timetable entries found.</div>
      ) : (
        Object.keys(groupedTimetable).map((day) => (
          <div key={day}>
            <h3>{day}</h3>
            <table>
              <thead>
                <tr>
                  <th>Timings</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {groupedTimetable[day]
                  .sort((a, b) => a.period - b.period)
                  .map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatTime(entry.startTime, entry.endTime)}</td>
                      <td>{entry.className}</td>
                      <td>{entry.sectionName}</td>
                      <td>{entry.subjectName}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default TeacherTimetable;
