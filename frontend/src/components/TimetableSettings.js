import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import TimePicker from 'react-time-picker';
import './TimetableSettings.css';

const TimetableSettings = () => {
  const { schoolId } = useOutletContext();
  const [settings, setSettings] = useState({
    periodsPerDay: 8,
    durationPerPeriod: 45,
    schoolStartTime: '08:30 AM',
    schoolEndTime: '04:00 PM',
    assemblyStartTime: '08:30 AM',
    assemblyEndTime: '08:45 AM',
    lunchStartTime: '12:45 PM',
    lunchEndTime: '01:15 PM',
    shortBreak1StartTime: '10:15 AM',
    shortBreak1EndTime: '10:25 AM',
    shortBreak2StartTime: '02:15 PM',
    shortBreak2EndTime: '02:25 PM',
    reserveType: 'time', // Could be 'time' or 'day'
    reserveDay: {},
    reserveTimeStart: '',
    reserveTimeEnd: '',
    applyToAll: false,
  });
  const [periodTimings, setPeriodTimings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTimetableSettings();
  }, [schoolId]);

  const fetchTimetableSettings = async () => {
    try {
      const response = await axios.get(`https://tms.up.school/api/schools/${schoolId}/timetable`);
      const data = response.data;
      if (data.reserveDay) {
        data.reserveDay = JSON.parse(data.reserveDay);
      }
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch timetable settings:', error);
      setError('Failed to fetch timetable settings.');
    }
  };

  useEffect(() => {
    calculatePeriodTimings();
  }, [settings]);

  const calculatePeriodTimings = () => {
    // Simplified version of period calculations for brevity
    setPeriodTimings([/* calculated periods based on settings */]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate and submit logic here
  };

  return (
    <div className="timetable-settings-container">
      <h2>Timetable Settings</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* Form controls for setting times and periods */}
        
        {/* Dynamic reserve settings based on reserveType */}
        {settings.reserveType === 'day' && (
          <div>
            {/* Day-specific reservation UI elements */}
          </div>
        )}
        {settings.reserveType === 'time' && (
          <div>
            {/* Time-specific reservation UI elements */}
            <label>Reserve Time Start:</label>
            <TimePicker
              onChange={(value) => setSettings(prev => ({ ...prev, reserveTimeStart: value }))}
              value={settings.reserveTimeStart}
              format="h:mm a"
              disableClock
            />
            <label>Reserve Time End:</label>
            <TimePicker
              onChange={(value) => setSettings(prev => ({ ...prev, reserveTimeEnd: value }))}
              value={settings.reserveTimeEnd}
              format="h:mm a"
              disableClock
            />
          </div>
        )}

        <button type="submit">Save Timetable Settings</button>
      </form>
    </div>
  );
};

export default TimetableSettings;
