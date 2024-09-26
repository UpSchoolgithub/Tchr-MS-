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
        const response = await axiosInstance.get(`/timetable/teachers/${teacherId}/timetable`);
        console.log('API Response:', response.data); // Log the entire API response
        setTimetable(response.data);
      } catch (err) {
        setError('Failed to load timetable');
        console.error('Error fetching timetable:', err);
      }
    };

    fetchTimetable();
  }, [teacherId]);

  const formatTime = (startTime, endTime) => {
    console.log('Start Time:', startTime, 'End Time:', endTime); // Log startTime and endTime
    if (!startTime || !endTime) return 'N/A';
    const format = (time) => {
      const date = new Date(time);
      if (isNaN(date.getTime())) {
        console.error('Invalid date format:', time); // Log if date is invalid
        return 'Invalid Time';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    return `${format(startTime)} - ${format(endTime)}`;
  };

  const groupedTimetable = timetable.reduce((acc, entry) => {
    const day = entry.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {});

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (timetable.length === 0) {
    return <div>No timetable entries found.</div>;
  }

  return (
    <div>
      <h2>Teacher Timetable</h2>
      {Object.keys(groupedTimetable).map((day) => (
        <div key={day}>
          <h3>{day}</h3>
          <table>
            <thead>
              <tr>
                <th>Timings</th>
                <th>School</th>
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
                    <td>{entry.schoolName}</td>
                    <td>{entry.className}</td>
                    <td>{entry.sectionName}</td>
                    <td>{entry.subjectName}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default TeacherTimetable;
