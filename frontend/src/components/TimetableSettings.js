import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import './TimetableSettings.css';

const TimetableSettings = () => {
  const { schoolId } = useOutletContext();
  const [settings, setSettings] = useState({
    periodsPerDay: '',
    durationPerPeriod: '',
    schoolStartTime: '',
    schoolEndTime: '',
    assemblyStartTime: '',
    assemblyEndTime: '',
    lunchStartTime: '',
    lunchEndTime: '',
    shortBreak1StartTime: '',
    shortBreak1EndTime: '',
    shortBreak2StartTime: '',
    shortBreak2EndTime: '',
    reserveType: 'time',
    reserveDay: {},
    reserveTimeStart: '',
    reserveTimeEnd: '',
    applyToAll: false,
    periodTimings: []
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await axios.get(`https://tms.up.school/api/schools/${schoolId}/timetable`);
        const data = response.data;

        if (data.reserveDay) {
          data.reserveDay = JSON.parse(data.reserveDay);
        } else {
          data.reserveDay = {};
        }

        // Generate period timings based on the number of periods and their duration
        const periodTimings = generatePeriodTimings(data.periodsPerDay, data.durationPerPeriod, data.schoolStartTime);

        setSettings({
          ...data,
          periodTimings
        });
      } catch (error) {
        console.error('Failed to fetch timetable settings:', error);
        setError('Failed to fetch timetable settings.');
      }
    };

    if (schoolId) {
      fetchTimetable();
    }
  }, [schoolId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('reserveDay')) {
      const [_, day, field] = name.split('-');
      setSettings((prevSettings) => {
        const updatedDaySettings = { ...prevSettings.reserveDay[day], [field || 'open']: type === 'checkbox' ? checked : value };

        if (type === 'checkbox' && !checked) {
          updatedDaySettings.start = '';
          updatedDaySettings.end = '';
        }

        return {
          ...prevSettings,
          reserveDay: {
            ...prevSettings.reserveDay,
            [day]: updatedDaySettings,
          },
        };
      });
    } else if (name === 'applyToAll') {
      setSettings((prevSettings) => ({
        ...prevSettings,
        applyToAll: checked,
      }));
    } else {
      setSettings((prevSettings) => ({
        ...prevSettings,
        [name]: value,
      }));
    }
  };

  const validateTimetable = () => {
    const { schoolStartTime, schoolEndTime } = settings;

    const timeOrderValid = (start, end) => {
      if (start && end) {
        return new Date(`1970-01-01T${start}:00`) < new Date(`1970-01-01T${end}:00`);
      }
      return true;
    };

    if (!timeOrderValid(schoolStartTime, schoolEndTime)) {
      return 'School Start Time should be earlier than School End Time.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateTimetable();
    if (validationError) {
      setError(validationError);
      return;
    }

    const updatedReserveDay = { ...settings.reserveDay };
    if (settings.applyToAll && settings.reserveTimeStart && settings.reserveTimeEnd) {
      for (const day in updatedReserveDay) {
        if (updatedReserveDay[day].open) {
          updatedReserveDay[day].start = settings.reserveTimeStart;
          updatedReserveDay[day].end = settings.reserveTimeEnd;
        }
      }
    }

    try {
      const settingsToSave = {
        ...settings,
        reserveDay: JSON.stringify(updatedReserveDay),
      };
      await axios.put(`https://tms.up.school/api/schools/${schoolId}/timetable`, settingsToSave);
      alert('Timetable settings saved successfully!');
    } catch (error) {
      console.error('Error saving timetable settings:', error);
      alert('Failed to save timetable settings.');
    }
  };

  const generatePeriodTimings = (periodsPerDay, durationPerPeriod, schoolStartTime) => {
    const periodTimings = [];
    let startTime = new Date(`1970-01-01T${schoolStartTime}:00`);

    for (let i = 0; i < periodsPerDay; i++) {
      const endTime = new Date(startTime.getTime() + durationPerPeriod * 60000);
      periodTimings.push({
        start: formatTime(startTime),
        end: formatTime(endTime),
      });
      startTime = endTime;
    }

    return periodTimings;
  };

  const formatTime = (date) => {
    return date.toTimeString().split(' ')[0].substring(0, 5);
  };

  return (
    <div className="timetable-settings-container">
      <h2>Timetable Settings</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="timetable-settings-form">
        <h3>School Timings</h3>
        <div className="form-section">
          <div className="form-group">
            <label>School Start Time:</label>
            <input
              type="time"
              name="schoolStartTime"
              value={settings.schoolStartTime}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>School End Time:</label>
            <input
              type="time"
              name="schoolEndTime"
              value={settings.schoolEndTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <h3>Period Timings</h3>
        <div className="form-section">
          <div className="form-group">
            <label>Periods Per Day:</label>
            <input
              type="number"
              name="periodsPerDay"
              value={settings.periodsPerDay}
              onChange={(e) => {
                handleChange(e);
                const newPeriodTimings = generatePeriodTimings(
                  e.target.value,
                  settings.durationPerPeriod,
                  settings.schoolStartTime
                );
                setSettings((prevSettings) => ({
                  ...prevSettings,
                  periodTimings: newPeriodTimings,
                }));
              }}
              required
            />
          </div>
          <div className="form-group">
            <label>Duration of Period (minutes):</label>
            <input
              type="number"
              name="durationPerPeriod"
              value={settings.durationPerPeriod}
              onChange={(e) => {
                handleChange(e);
                const newPeriodTimings = generatePeriodTimings(
                  settings.periodsPerDay,
                  e.target.value,
                  settings.schoolStartTime
                );
                setSettings((prevSettings) => ({
                  ...prevSettings,
                  periodTimings: newPeriodTimings,
                }));
              }}
              required
            />
          </div>
          {settings.periodTimings.map((timing, index) => (
            <div key={index} className="form-group-row">
              <div className="form-group">
                <label>Period {index + 1} Start Time:</label>
                <input
                  type="time"
                  name={`periodStart-${index}`}
                  value={timing.start}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Period {index + 1} End Time:</label>
                <input
                  type="time"
                  name={`periodEnd-${index}`}
                  value={timing.end}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          ))}
        </div>
        <h3>Reserve Type</h3>
        <div className="form-section">
          <div className="form-group">
            <label>Reserve Type:</label>
            <select name="reserveType" value={settings.reserveType} onChange={handleChange}>
              <option value="time">Time</option>
              <option value="day">Day</option>
            </select>
          </div>
          {settings.reserveType === 'day' && (
            <>
              <div className="reserve-day-section">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <div key={day} className="reserve-day-group">
                    <label className="day-label">
                      <input
                        type="checkbox"
                        name={`reserveDay-${day}-open`}
                        checked={settings.reserveDay[day]?.open || false}
                        onChange={handleChange}
                      />
                      {day}
                    </label>
                    {settings.reserveDay[day]?.open && (
                      <div className="day-time-group">
                        <input
                          type="time"
                          name={`reserveDay-${day}-start`}
                          value={settings.reserveDay[day]?.start || ''}
                          onChange={handleChange}
                        />
                        <span>to</span>
                        <input
                          type="time"
                          name={`reserveDay-${day}-end`}
                          value={settings.reserveDay[day]?.end || ''}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label>
                  Apply one particular time to all selected days
                  <input
                    type="checkbox"
                    name="applyToAll"
                    checked={settings.applyToAll}
                    onChange={handleChange}
                  />
                </label>
                {settings.applyToAll && (
                  <div className="day-time-group">
                    <input
                      type="time"
                      name="reserveTimeStart"
                      value={settings.reserveTimeStart}
                      onChange={handleChange}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      name="reserveTimeEnd"
                      value={settings.reserveTimeEnd}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          {settings.reserveType === 'time' && (
            <>
              <div className="form-group">
                <label>Reserve Time Start:</label>
                <input
                  type="time"
                  name="reserveTimeStart"
                  value={settings.reserveTimeStart}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Reserve Time End:</label>
                <input
                  type="time"
                  name="reserveTimeEnd"
                  value={settings.reserveTimeEnd}
                  onChange={handleChange}
                />
              </div>
            </>
          )}
        </div>
        <button type="submit" className="save-button">Save Timetable Settings</button>
      </form>
    </div>
  );
};

export default TimetableSettings;
