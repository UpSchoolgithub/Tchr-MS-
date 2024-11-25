import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import './SchoolCalendar.css'; // Optional: Add styles for the calendar

const SchoolCalendar = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [filter, setFilter] = useState('all'); // To toggle between events and holidays

  useEffect(() => {
    // Fetch all schools
    const fetchSchools = async () => {
      try {
        const response = await axiosInstance.get('/schools'); // API endpoint to fetch schools
        setSchools(response.data);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };

    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      // Fetch calendar events and holidays for the selected school
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
            <p>No events or holidays found for this school.</p>
          )
        ) : (
          <p>Please select a school to view the calendar.</p>
        )}
      </div>
    </div>
  );
};

export default SchoolCalendar;
