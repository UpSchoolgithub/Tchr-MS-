import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import './SchoolCalendar.css'; // Optional: Add styles for the calendar

const SchoolCalendar = () => {
  const { teacherId } = useTeacherAuth(); // Get teacherId from the auth context
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [filter, setFilter] = useState('all'); // Toggle between events and holidays

  // Fetch schools related to the teacher
  const fetchSchools = async () => {
    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
      const uniqueSchools = [
        ...new Map(
          response.data.map((assignment) => [
            assignment.schoolId,
            { id: assignment.schoolId, name: assignment.schoolName },
          ])
        ).values(),
      ];
      setSchools(uniqueSchools);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  // Fetch calendar events and holidays for the selected school
  useEffect(() => {
    if (selectedSchool) {
      const fetchCalendarData = async () => {
        try {
          const eventsResponse = await axiosInstance.get(`/schools/${selectedSchool}/calendar`);
          const holidaysResponse = await axiosInstance.get(`/schools/${selectedSchool}/holidays`);
          setCalendarEvents(eventsResponse.data);
          setHolidays(holidaysResponse.data);
        } catch (error) {
          console.error('Error fetching calendar data:', error);
        }
      };

      fetchCalendarData();
    }
  }, [selectedSchool]);

  // Fetch schools on component mount
  useEffect(() => {
    if (teacherId) fetchSchools();
  }, [teacherId]);

  const handleSchoolChange = (e) => {
    setSelectedSchool(e.target.value);
  };

  const filteredList = [...calendarEvents, ...holidays].filter((item) => {
    if (filter === 'events') return item.eventName;
    if (filter === 'holidays') return item.name;
    return true; // Default: Show all
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="school-calendar-container">
  <h1>School Calendar</h1>
  <div className="filters">
    <label>
      Select School:
      <select value={selectedSchool} onChange={handleSchoolChange}>
        <option value="">-- Select a School --</option>
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.name}
          </option>
        ))}
      </select>
    </label>
    <label>
      Filter:
      <select onChange={(e) => setFilter(e.target.value)} value={filter}>
        <option value="all">All</option>
        <option value="events">Events</option>
        <option value="holidays">Holidays</option>
      </select>
    </label>
  </div>
  <div className="calendar">
    {selectedSchool ? (
      filteredList.length > 0 ? (
        <table className="calendar-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item, index) => (
              <tr key={index}>
                <td>{item.eventName || item.name}</td>
                <td>{formatDate(item.date || item.startDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-data-message">No events found for the selected filter.</p>
      )
    ) : (
      <p className="no-data-message">Please select a school to view the calendar.</p>
    )}
  </div>
</div>

  );
};

export default SchoolCalendar;
