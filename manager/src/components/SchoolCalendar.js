import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';

const SchoolCalendar = ({ schoolId }) => {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'events', 'holidays'
  const [showCalendar, setShowCalendar] = useState(true); // Initially set to true to show the calendar

  useEffect(() => {
    if (schoolId) {
      fetchCalendarEventsAndHolidays(schoolId);
    }
  }, [schoolId]);

  const fetchCalendarEventsAndHolidays = async (schoolId) => {
    try {
      const eventsResponse = await axiosInstance.get(`/schools/${schoolId}/calendar`);
      const holidaysResponse = await axiosInstance.get(`/schools/${schoolId}/holidays`);
      setCalendarEvents(eventsResponse.data);
      setHolidays(holidaysResponse.data);
    } catch (error) {
      console.error('Error fetching calendar events and holidays:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const combinedList = [...calendarEvents, ...holidays].sort((a, b) => new Date(a.date || a.startDate) - new Date(b.date || b.startDate));

  const filteredList = combinedList.filter((item) => {
    if (filter === 'events') return item.eventName;
    if (filter === 'holidays') return item.name;
    return true;
  });

  return (
    <div>
      <h2>School Calendar Events</h2>
      <label>
        Filter:
        <select onChange={handleFilterChange} value={filter}>
          <option value="all">All</option>
          <option value="events">Events</option>
          <option value="holidays">Holidays</option>
        </select>
      </label>
      <div>
        {filteredList.length > 0 ? (
          <ul>
            {filteredList.map((item) => (
              <li key={item.id}>
                {item.eventName || item.name} - {item.date || `${item.startDate} to ${item.endDate}`}
              </li>
            ))}
          </ul>
        ) : (
          <p>No events found for this school.</p>
        )}
      </div>
    </div>
  );
};

export default SchoolCalendar;
