import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams } from 'react-router-dom';

const SchoolCalendar = () => {
  const { schoolId } = useParams();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${schoolId}/calendar`);
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    if (schoolId) {
      fetchEvents();
    }
  }, [schoolId]);

  return (
    <div>
      <h2>School Calendar</h2>
      {events.length > 0 ? (
        <ul>
          {events.map(event => (
            <li key={event.id}>
              {event.eventName} ({event.dateType === 'continuous' ? `${event.startDate} to ${event.endDate}` : event.variableDates.join(', ')})
            </li>
          ))}
        </ul>
      ) : (
        <p>No events found for this school.</p>
      )}
    </div>
  );
};

export default SchoolCalendar;
