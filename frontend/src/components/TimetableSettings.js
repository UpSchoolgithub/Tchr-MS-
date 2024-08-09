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
    periodTimings: [] // Ensure this is always initialized as an array
  });
  const [error, setError] = useState('');
  const [showPeriodSettings, setShowPeriodSettings] = useState(false); // New state variable

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

        // Ensure periodTimings is an array of objects with start and end times
        const initializedPeriodTimings = Array.from({ length: data.periodsPerDay }, (_, index) => ({
          start: data.periodTimings ? data.periodTimings[index]?.start || '' : '',
          end: data.periodTimings ? data.periodTimings[index]?.end || '' : ''
        }));

        setSettings({
          ...data,
          periodTimings: initializedPeriodTimings
        });
        setShowPeriodSettings(true); // Show period settings if periods are already defined
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.error('Timetable settings not found for this school.');
          setError('Timetable settings not found.');
        } else {
          console.error('Failed to fetch timetable settings:', error);
          setError('Failed to fetch timetable settings.');
        }
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
    } else if (name.startsWith('periodStart-')) {
      const index = parseInt(name.split('-')[1]);
      setSettings((prevSettings) => {
        const periodTimings = [...prevSettings.periodTimings];
        periodTimings[index] = {
          ...periodTimings[index],
          start: value
        };
        return { ...prevSettings, periodTimings };
      });
    } else if (name.startsWith('periodEnd-')) {
      const index = parseInt(name.split('-')[1]);
      setSettings((prevSettings) => {
        const periodTimings = [...prevSettings.periodTimings];
        periodTimings[index] = {
          ...periodTimings[index],
          end: value
        };
        return { ...prevSettings, periodTimings };
      });
    } else {
      setSettings((prevSettings) => ({
        ...prevSettings,
        [name]: value,
      }));
    }
  };

  const validateTimetable = () => {
    const {
      schoolStartTime,
      schoolEndTime,
      assemblyStartTime,
      assemblyEndTime,
      lunchStartTime,
      lunchEndTime,
      shortBreak1StartTime,
      shortBreak1EndTime,
      shortBreak2StartTime,
      shortBreak2EndTime,
    } = settings;

    const timeOrderValid = (start, end) => {
      if (start && end) {
        return new Date(`1970-01-01T${start}:00`) < new Date(`1970-01-01T${end}:00`);
      }
      return true;
    };

    if (!timeOrderValid(schoolStartTime, schoolEndTime)) {
      return 'School Start Time should be earlier than School End Time.';
    }
    if (!timeOrderValid(assemblyStartTime, assemblyEndTime)) {
      return 'Assembly Start Time should be earlier than Assembly End Time.';
    }
    if (!timeOrderValid(lunchStartTime, lunchEndTime)) {
      return 'Lunch Break Start Time should be earlier than Lunch Break End Time.';
    }
    if (!timeOrderValid(shortBreak1StartTime, shortBreak1EndTime)) {
      return 'Short Break 1 Start Time should be earlier than Short Break 1 End Time.';
    }
    if (!timeOrderValid(shortBreak2StartTime, shortBreak2EndTime)) {
      return 'Short Break 2 Start Time should be earlier than Short Break 2 End Time.';
    }
    if (schoolEndTime && (new Date(`1970-01-01T${assemblyEndTime}:00`) > new Date(`1970-01-01T${schoolEndTime}:00`) ||
      new Date(`1970-01-01T${lunchEndTime}:00`) > new Date(`1970-01-01T${schoolEndTime}:00`) ||
      new Date(`1970-01-01T${shortBreak1EndTime}:00`) > new Date(`1970-01-01T${schoolEndTime}:00`) ||
      new Date(`1970-01-01T${shortBreak2EndTime}:00`) > new Date(`1970-01-01T${schoolEndTime}:00`))) {
      return 'All activities should end before School End Time.';
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
      setShowPeriodSettings(true); // Show period settings after saving
    } catch (error) {
      console.error('Error saving timetable settings:', error);
      alert('Failed to save timetable settings.');
    }
  };

  return (
    <div className="timetable-settings-container">
      <h2>Timetable Settings</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="timetable-settings-form">
        <h3>School Timings</h3>
        <div className="form-section">
          <div className="form-group-row">
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
            <div className="form-group">
              <label>Assembly Start Time:</label>
              <input
                type="time"
                name="assemblyStartTime"
                value={settings.assemblyStartTime}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Assembly End Time:</label>
              <input
                type="time"
                name="assemblyEndTime"
                value={settings.assemblyEndTime}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Lunch Break Start Time:</label>
              <input
                type="time"
                name="lunchStartTime"
                value={settings.lunchStartTime}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Lunch Break End Time:</label>
              <input
                type="time"
                name="lunchEndTime"
                value={settings.lunchEndTime}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Short Break 1 Start Time:</label>
              <input
                type="time"
                name="shortBreak1StartTime"
                value={settings.shortBreak1StartTime}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Short Break 1 End Time:</label>
              <input
                type="time"
                name="shortBreak1EndTime"
                value={settings.shortBreak1EndTime}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Short Break 2 Start Time:</label>
              <input
                type="time"
                name="shortBreak2StartTime"
                value={settings.shortBreak2StartTime}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Short Break 2 End Time:</label>
              <input
                type="time"
                name="shortBreak2EndTime"
                value={settings.shortBreak2EndTime}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label>Periods Per Day:</label>
            <input
              type="number"
              name="periodsPerDay"
              value={settings.periodsPerDay}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Duration of Period (minutes):</label>
            <input
              type="number"
              name="durationPerPeriod"
              value={settings.durationPerPeriod}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <button type="submit" className="save-button">Save Timetable Settings</button>

        {showPeriodSettings && (
          <>
            <h3>Period Timings</h3>
            <div className="form-section">
              {settings.periodTimings.map((_, index) => (
                <div key={index} className="form-group-row">
                  <div className="form-group">
                    <label>Period {index + 1} Start Time:</label>
                    <input
                      type="time"
                      name={`periodStart-${index}`}
                      value={settings.periodTimings[index].start}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Period {index + 1} End Time:</label>
                    <input
                      type="time"
                      name={`periodEnd-${index}`}
                      value={settings.periodTimings[index].end}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

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
      </form>
    </div>
  );
};

export default TimetableSettings;
