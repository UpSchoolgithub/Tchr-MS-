import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import moment from 'moment-timezone';
import 'react-calendar/dist/Calendar.css';
import './SchoolCalendar.css';
import { useOutletContext } from 'react-router-dom';

const SchoolCalendar = () => {
  const { schoolId } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [filteredHolidays, setFilteredHolidays] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [eventName, setEventName] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDay, setHolidayDay] = useState('');
  const [dateType, setDateType] = useState('variable');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [activeStartDate, setActiveStartDate] = useState(new Date(filterYear, filterMonth - 1));

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/schools/${schoolId}/calendar`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/schools/${schoolId}/holidays`);
      setHolidays(response.data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  useEffect(() => {
    if (!schoolId) {
      console.error('No schoolId provided');
      return;
    }

    fetchEvents();
    fetchHolidays();
  }, [schoolId]);

  useEffect(() => {
    filterItems();
  }, [filterMonth, filterYear, holidays, events]);

  const sortItemsByDate = (items) => {
    return items.sort((a, b) => new Date(a.date || a.startDate) - new Date(b.date || b.startDate));
  };

  const filterItems = () => {
    const filteredHolidays = holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getMonth() + 1 === parseInt(filterMonth, 10) && holidayDate.getFullYear() === parseInt(filterYear, 10);
    });

    const filteredEvents = events.filter(event => {
      if (event.dateType === 'continuous') {
        const eventStartDate = new Date(event.startDate);
        const eventEndDate = new Date(event.endDate);
        return (
          (eventStartDate.getMonth() + 1 === parseInt(filterMonth, 10) && eventStartDate.getFullYear() === parseInt(filterYear, 10)) ||
          (eventEndDate.getMonth() + 1 === parseInt(filterMonth, 10) && eventEndDate.getFullYear() === parseInt(filterYear, 10))
        );
      } else {
        return event.variableDates.some(date => {
          const eventDate = new Date(date);
          return eventDate.getMonth() + 1 === parseInt(filterMonth, 10) && eventDate.getFullYear() === parseInt(filterYear, 10);
        });
      }
    });

    setFilteredHolidays(filteredHolidays.length > 0 ? sortItemsByDate(filteredHolidays) : []);
    setFilteredEvents(filteredEvents.length > 0 ? sortItemsByDate(filteredEvents) : []);
  };

  const handleDateClick = (date) => {
    const dateIST = moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD');
    if (dateType === 'continuous') {
      if (!startDate) {
        setStartDate(dateIST);
      } else if (!endDate || new Date(dateIST) < new Date(startDate)) {
        setEndDate(dateIST);
      } else {
        setStartDate(dateIST);
        setEndDate(null);
      }
    } else {
      if (selectedDates.includes(dateIST)) {
        setSelectedDates(selectedDates.filter(d => d !== dateIST));
      } else {
        setSelectedDates([...selectedDates, dateIST]);
      }
    }
  };

  const handleDateDeselect = (date) => {
    setSelectedDates(selectedDates.filter(d => d !== date));
  };

  const handleDeleteHoliday = async (holidayId) => {
    const confirmDelete = window.confirm('Do you want to delete this holiday?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/schools/${schoolId}/holidays/${holidayId}`);
      setHolidays(holidays.filter(h => h.id !== holidayId));
    } catch (error) {
      console.error('Error deleting holiday:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const confirmDelete = window.confirm('Do you want to delete this event?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/schools/${schoolId}/calendar/${eventId}`);
      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();

    if (!schoolId) {
      console.error('No schoolId provided');
      return;
    }

    if (dateType === 'variable' && selectedDates.length === 0) {
      alert('Please select at least one date.');
      return;
    }

    if (dateType === 'continuous' && (!startDate || !endDate)) {
      alert('Please select a start and end date.');
      return;
    }

    try {
      const eventDetails = dateType === 'continuous'
        ? { eventName, startDate, endDate, dateType }
        : { eventName, dateType, variableDates: selectedDates };

      const response = await axios.post(`http://localhost:5000/api/schools/${schoolId}/calendar`, eventDetails);
      setEvents(sortItemsByDate([...events, response.data]));
      setEventName('');
      setSelectedDates([]);
      setStartDate(null);
      setEndDate(null);
      setDateType('variable');
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleSubmitHoliday = async (e) => {
    e.preventDefault();

    if (!schoolId) {
      console.error('No schoolId provided');
      return;
    }

    if (!holidayName || !holidayDate) {
      alert('Please fill in all holiday details.');
      return;
    }

    try {
      const holidayDetails = { name: holidayName, date: holidayDate, day: holidayDay };

      const response = await axios.post(`http://localhost:5000/api/schools/${schoolId}/holidays`, holidayDetails);
      setHolidays(sortItemsByDate([...holidays, response.data]));
      setHolidayName('');
      setHolidayDate('');
      setHolidayDay('');
    } catch (error) {
      console.error('Error creating holiday:', error);
    }
  };

  const handleHolidayDateChange = (e) => {
    const date = e.target.value;
    setHolidayDate(date);
    setHolidayDay(moment(date).tz('Asia/Kolkata').format('dddd'));
  };

  const tileContent = ({ date, view }) => {
    const dateIST = moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD');
    const event = events.find(e => e.startDate <= dateIST && e.endDate >= dateIST);

    return (
      <div>
        {event && (
          <div className="event">
            {event.eventName}
          </div>
        )}
      </div>
    );
  };

  const handleFilterMonthChange = (e) => {
    setFilterMonth(e.target.value);
    setActiveStartDate(new Date(filterYear, e.target.value - 1));
  };

  const handleFilterYearChange = (e) => {
    setFilterYear(e.target.value);
    setActiveStartDate(new Date(e.target.value, filterMonth - 1));
  };

  const handleCalendarChange = (date) => {
    setFilterMonth(date.getMonth() + 1);
    setFilterYear(date.getFullYear());
    setActiveStartDate(date);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>School Calendar</h2>
        <div>
          <label>Filter by Month:</label>
          <select value={filterMonth} onChange={handleFilterMonthChange}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
            ))}
          </select>
          <label>Filter by Year:</label>
          <input type="number" value={filterYear} onChange={handleFilterYearChange} />
        </div>
      </div>
      <div className="calendar-content">
        <div className="calendar-section">
          <Calendar
            onClickDay={handleDateClick}
            value={activeStartDate}
            onActiveStartDateChange={({ activeStartDate }) => handleCalendarChange(activeStartDate)}
            tileContent={tileContent}
            tileClassName={({ date, view }) => {
              const dateIST = moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD');
              if (selectedDates.includes(dateIST) || (dateType === 'continuous' && date >= new Date(startDate) && date <= new Date(endDate))) {
                return 'selected-date';
              }
              if (view === 'month' && events.some(event =>
                date >= new Date(event.startDate) && date <= new Date(event.endDate)
              )) {
                return 'event-date';
              }
              if (view === 'month' && holidays.some(holiday =>
                dateIST === holiday.date
              )) {
                return 'holiday-date';
              }
            }}
          />
        </div>
        <div className="holidays-section">
          <h3>Holidays</h3>
          <div className="scrollable">
            {filteredHolidays.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Holiday Name</th>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHolidays.map(holiday => (
                    <tr key={holiday.id}>
                      <td>{holiday.name}</td>
                      <td>{holiday.date}</td>
                      <td>{holiday.day}</td>
                      <td><button onClick={() => handleDeleteHoliday(holiday.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No holidays found.</p>
            )}
          </div>
          <form onSubmit={handleSubmitHoliday}>
            <div>
              <label>Holiday Name:</label>
              <input
                type="text"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Holiday Date:</label>
              <input
                type="date"
                value={holidayDate}
                onChange={handleHolidayDateChange}
                required
              />
            </div>
            <div>
              <label>Holiday Day:</label>
              <input
                type="text"
                value={holidayDay}
                readOnly
              />
            </div>
            <button type="submit">Add Holiday</button>
          </form>
        </div>
      </div>
      <div className="events-section">
        <h3>Events</h3>
        <div className="scrollable">
          {filteredEvents.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Dates</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => (
                  <tr key={event.id}>
                    <td>{event.eventName}</td>
                    <td>{event.dateType === 'continuous' ? `${event.startDate} to ${event.endDate}` : event.variableDates.join(', ')}</td>
                    <td><button onClick={() => handleDeleteEvent(event.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No events found.</p>
          )}
        </div>
        <form onSubmit={handleSubmitEvent}>
          <div>
            <label>Event Name:</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Date Type:</label>
            <select value={dateType} onChange={(e) => setDateType(e.target.value)}>
              <option value="variable">Variable Dates</option>
              <option value="continuous">Continuous Dates</option>
            </select>
          </div>
          {dateType === 'continuous' ? (
            <div>
              <label>Start Date:</label>
              <input type="text" value={startDate || ''} readOnly />
              <label>End Date:</label>
              <input type="text" value={endDate || ''} readOnly />
            </div>
          ) : (
            <div>
              <label>Selected Dates:</label>
              <div className="selected-dates-box">
                {selectedDates.length > 0 ? (
                  <div>
                    {selectedDates.map(date => (
                      <span key={date} className="selected-date-item">
                        {date}
                        <button type="button" onClick={() => handleDateDeselect(date)}>X</button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span>No dates selected</span>
                )}
              </div>
            </div>
          )}
          <button type="submit">Add Event</button>
        </form>
      </div>
    </div>
  );
};

export default SchoolCalendar;
