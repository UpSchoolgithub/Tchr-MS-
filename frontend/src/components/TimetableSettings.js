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
    includeSaturday: false,  // Add includeSaturday here
    periodTimings: [],
  });

  const [error, setError] = useState('');
  const [showPeriodSettings, setShowPeriodSettings] = useState(false);

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

        setSettings({
          ...data,
          periodTimings: data.periodTimings || [], // Ensure this is an array
        });

        if (data.periodTimings && data.periodTimings.length > 0) {
          setShowPeriodSettings(true);
        }
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
        const updatedDaySettings = {
          ...prevSettings.reserveDay[day],
          [field || 'open']: type === 'checkbox' ? checked : value,
        };
  
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
    } else if (name === 'includeSaturday') {
      setSettings((prevSettings) => {
        const updatedReserveDay = { ...prevSettings.reserveDay };
        
        // Clear Saturday timings if unchecked
        if (!checked) {
          updatedReserveDay["Saturday"] = { open: false, start: '', end: '' };
        }
        
        return {
          ...prevSettings,
          includeSaturday: checked,
          reserveDay: updatedReserveDay
        };
      });
    } else if (name === 'applyToAll') {
      setSettings((prevSettings) => ({
        ...prevSettings,
        applyToAll: checked,
      }));
    } else if (name.startsWith('periodStart-')) {
      const index = parseInt(name.split('-')[1], 10);
      setSettings((prevSettings) => {
        const periodTimings = [...prevSettings.periodTimings];
        periodTimings[index] = {
          ...periodTimings[index],
          start: value,
        };
        return { ...prevSettings, periodTimings };
      });
    } else if (name.startsWith('periodEnd-')) {
      const index = parseInt(name.split('-')[1], 10);
      setSettings((prevSettings) => {
        const periodTimings = [...prevSettings.periodTimings];
        periodTimings[index] = {
          ...periodTimings[index],
          end: value,
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
  

  const handleSubmit = async (e) => {
  e.preventDefault();

  const updatedReserveDay = { ...settings.reserveDay };
  if (settings.applyToAll && settings.reserveTimeStart && settings.reserveTimeEnd) {
    // Apply to Monday to Friday by default
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].forEach((day) => {
      if (!updatedReserveDay[day]) {
        updatedReserveDay[day] = { open: true };
      }
      updatedReserveDay[day].start = settings.reserveTimeStart;
      updatedReserveDay[day].end = settings.reserveTimeEnd;
    });

    // Optionally include Saturday if checkbox is selected
    if (settings.includeSaturday) {
      if (!updatedReserveDay["Saturday"]) {
        updatedReserveDay["Saturday"] = { open: true };
      }
      updatedReserveDay["Saturday"].start = settings.reserveTimeStart;
      updatedReserveDay["Saturday"].end = settings.reserveTimeEnd;
    }
  }

  try {
    const settingsToSave = {
      ...settings,
      reserveDay: JSON.stringify(updatedReserveDay),
      periodTimings: settings.periodTimings, // Ensure periodTimings is included
    };
    await axios.put(`https://tms.up.school/api/schools/${schoolId}/timetable`, settingsToSave);
    alert('Timetable settings saved successfully!');
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
          <button
            type="button"
            onClick={handleSavePeriodSettings}
            className="save-button"
          >
            Save Period Settings
          </button>
        </div>

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

        {showPeriodSettings && settings.periodTimings.length > 0 && (
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
                      value={settings.periodTimings[index]?.start || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Period {index + 1} End Time:</label>
                    <input
                      type="time"
                      name={`periodEnd-${index}`}
                      value={settings.periodTimings[index]?.end || ''}
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

  {/* Note for Reserve Type: Time */}
  {settings.reserveType === 'time' && (
    <div className="form-group note">
      <p>
        <strong>Note:</strong> This reserved time will apply from <strong>Monday to Friday</strong> by default. 
        If you want to include Saturday, tick the "Include Saturday" option below. 
        For a customized schedule for each day, please choose "Reserve Type: Day."
      </p>
    </div>
  )}

  {settings.reserveType === 'day' && (
    <>
      <div className="reserve-day-section">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
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
      <div className="form-group">
        <label>
          Include Saturday
          <input
            type="checkbox"
            name="includeSaturday"
            checked={settings.includeSaturday}
            onChange={handleChange}
          />
        </label>
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