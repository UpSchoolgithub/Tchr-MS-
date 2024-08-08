import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import './TimetableSettings.css';

const TimetableSettings = () => {
  const { schoolId } = useOutletContext();
  const [settings, setSettings] = useState({
    periodsPerDay: '',
    durationPerPeriod: '',
    schoolStartTime: { time: '', period: 'AM' },
    schoolEndTime: { time: '', period: 'AM' },
    assemblyStartTime: { time: '', period: 'AM' },
    assemblyEndTime: { time: '', period: 'AM' },
    lunchStartTime: { time: '', period: 'AM' },
    lunchEndTime: { time: '', period: 'AM' },
    shortBreak1StartTime: { time: '', period: 'AM' },
    shortBreak1EndTime: { time: '', period: 'AM' },
    shortBreak2StartTime: { time: '', period: 'AM' },
    shortBreak2EndTime: { time: '', period: 'AM' },
    reserveType: 'time',
    reserveDay: {},
    reserveTimeStart: { time: '', period: 'AM' },
    reserveTimeEnd: { time: '', period: 'AM' },
    applyToAll: false,
  });
  const [periodTimings, setPeriodTimings] = useState([]);
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

        setSettings(data);
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

  useEffect(() => {
    calculatePeriodTimings();
  }, [settings]);

  const calculatePeriodTimings = () => {
    const {
      periodsPerDay,
      durationPerPeriod,
      assemblyEndTime,
      lunchStartTime,
      lunchEndTime,
      shortBreak1StartTime,
      shortBreak1EndTime,
      shortBreak2StartTime,
      shortBreak2EndTime,
      schoolEndTime
    } = settings;

    let currentStartTime = combineTimeAndPeriod(assemblyEndTime.time, assemblyEndTime.period);
    const timings = [];

    for (let i = 1; i <= periodsPerDay; i++) {
      let nextStartTime = addMinutes(currentStartTime, durationPerPeriod);

      if (convertTo24Hour(nextStartTime) > convertTo24Hour(combineTimeAndPeriod(schoolEndTime.time, schoolEndTime.period))) {
        alert('The periods exceed the school end time.');
        break;
      }

      // Check for overlaps with breaks or lunch
      if (isOverlapping(currentStartTime, nextStartTime, combineTimeAndPeriod(lunchStartTime.time, lunchStartTime.period), combineTimeAndPeriod(lunchEndTime.time, lunchEndTime.period))) {
        currentStartTime = combineTimeAndPeriod(lunchEndTime.time, lunchEndTime.period);
        nextStartTime = addMinutes(currentStartTime, durationPerPeriod);
      } else if (isOverlapping(currentStartTime, nextStartTime, combineTimeAndPeriod(shortBreak1StartTime.time, shortBreak1StartTime.period), combineTimeAndPeriod(shortBreak1EndTime.time, shortBreak1EndTime.period))) {
        currentStartTime = combineTimeAndPeriod(shortBreak1EndTime.time, shortBreak1EndTime.period);
        nextStartTime = addMinutes(currentStartTime, durationPerPeriod);
      } else if (isOverlapping(currentStartTime, nextStartTime, combineTimeAndPeriod(shortBreak2StartTime.time, shortBreak2StartTime.period), combineTimeAndPeriod(shortBreak2EndTime.time, shortBreak2EndTime.period))) {
        currentStartTime = combineTimeAndPeriod(shortBreak2EndTime.time, shortBreak2EndTime.period);
        nextStartTime = addMinutes(currentStartTime, durationPerPeriod);
      }

      timings.push({ period: i, start: currentStartTime, end: nextStartTime });
      currentStartTime = nextStartTime;
    }

    setPeriodTimings(timings);
  };

  const combineTimeAndPeriod = (time, period) => {
    return `${time} ${period}`;
  };

  const addMinutes = (time, minutes) => {
    const date = new Date(`1970-01-01T${convertTo24Hour(time)}:00`);
    date.setMinutes(date.getMinutes() + minutes);
    return formatTime(date);
  };

  const isOverlapping = (start1, end1, start2, end2) => {
    return convertTo24Hour(start1) < convertTo24Hour(end2) && convertTo24Hour(end1) > convertTo24Hour(start2);
  };

  const convertTo24Hour = (time) => {
    let [hours, minutes] = time.split(/[: ]/);
    const ampm = time.slice(-2).toUpperCase();
    if (ampm === 'PM' && hours !== '12') {
      hours = parseInt(hours, 10) + 12;
    } else if (ampm === 'AM' && hours === '12') {
      hours = '00';
    }
    return `${hours}:${minutes}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('period')) {
      const [key, field] = name.split('-');
      setSettings((prevSettings) => ({
        ...prevSettings,
        [key]: {
          ...prevSettings[key],
          [field]: value,
        },
      }));
    } else if (name.startsWith('reserveDay')) {
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
      if (start.time && end.time) {
        return new Date(`1970-01-01T${convertTo24Hour(combineTimeAndPeriod(start.time, start.period))}:00`) <
               new Date(`1970-01-01T${convertTo24Hour(combineTimeAndPeriod(end.time, end.period))}:00`);
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
    if (new Date(`1970-01-01T${convertTo24Hour(combineTimeAndPeriod(schoolEndTime.time, schoolEndTime.period))}:00`) <
        new Date(`1970-01-01T${convertTo24Hour(combineTimeAndPeriod(assemblyEndTime.time, assemblyEndTime.period))}:00`) ||
        new Date(`1970-01-01T${convertTo24Hour(combineTimeAndPeriod(schoolEndTime.time, schoolEndTime.period))}:00`) <
        new Date(`1970-01-01T${convertTo24Hour(combineTimeAndPeriod(lunchEndTime.time, lunchEndTime.period))}:00`) ||
        new Date(`1970-01-01T${convertTo24Hour(combineTimeAndPeriod(schoolEndTime.time, schoolEndTime.period))}:00`) <
        new Date(`1970-01-01T${convertTo24Hour(combineTimeAndPeriod(shortBreak1EndTime.time, shortBreak1EndTime.period))}:00`) ||
        new Date(`1970-01-01T${convertTo24Hour(combineTimeAndPeriod(schoolEndTime.time, schoolEndTime.period))}:00`) <
        new Date(`1970-01-01T${convertTo24Hour(combineTimeAndPeriod(shortBreak2EndTime.time, shortBreak2EndTime.period))}:00`)) {
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
    if (settings.applyToAll && settings.reserveTimeStart.time && settings.reserveTimeEnd.time) {
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
        </div>
        <h3>School Timings</h3>
        <div className="form-section">
          <div className="form-group-row">
            <div className="form-group">
              <label>School Start Time:</label>
              <input
                type="time"
                name="schoolStartTime-time"
                value={settings.schoolStartTime.time}
                onChange={handleChange}
                required
              />
              <select name="schoolStartTime-period" value={settings.schoolStartTime.period} onChange={handleChange}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <div className="form-group">
              <label>School End Time:</label>
              <input
                type="time"
                name="schoolEndTime-time"
                value={settings.schoolEndTime.time}
                onChange={handleChange}
                required
              />
              <select name="schoolEndTime-period" value={settings.schoolEndTime.period} onChange={handleChange}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <div className="form-group">
              <label>Assembly Start Time:</label>
              <input
                type="time"
                name="assemblyStartTime-time"
                value={settings.assemblyStartTime.time}
                onChange={handleChange}
              />
              <select name="assemblyStartTime-period" value={settings.assemblyStartTime.period} onChange={handleChange}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <div className="form-group">
              <label>Assembly End Time:</label>
              <input
                type="time"
                name="assemblyEndTime-time"
                value={settings.assemblyEndTime.time}
                onChange={handleChange}
              />
              <select name="assemblyEndTime-period" value={settings.assemblyEndTime.period} onChange={handleChange}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Lunch Break Start Time:</label>
              <input
                type="time"
                name="lunchStartTime-time"
                value={settings.lunchStartTime.time}
                onChange={handleChange}
              />
              <select name="lunchStartTime-period" value={settings.lunchStartTime.period} onChange={handleChange}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <div className="form-group">
              <label>Lunch Break End Time:</label>
              <input
                type="time"
                name="lunchEndTime-time"
                value={settings.lunchEndTime.time}
                onChange={handleChange}
              />
              <select name="lunchEndTime-period" value={settings.lunchEndTime.period} onChange={handleChange}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Short Break 1 Start Time:</label>
              <input
                type="time"
                name="shortBreak1StartTime-time"
                value={settings.shortBreak1StartTime.time}
                onChange={handleChange}
              />
              <select name="shortBreak1StartTime-period" value={settings.shortBreak1StartTime.period} onChange={handleChange}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <div className="form-group">
              <label>Short Break 1 End Time:</label>
              <input
                type="time"
                name="shortBreak1EndTime-time"
                value={settings.shortBreak1EndTime.time}
                onChange={handleChange}
              />
              <select name="shortBreak1EndTime-period" value={settings.shortBreak1EndTime.period} onChange={handleChange}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <div className="form-group">
              <label>Short Break 2 Start Time:</label>
              <input
                type="time"
                name="shortBreak2StartTime-time"
                value={settings.shortBreak2StartTime.time}
                onChange={handleChange}
              />
              <select name="shortBreak2StartTime-period" value={settings.shortBreak2StartTime.period} onChange={handleChange}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <div className="form-group">
              <label>Short Break 2 End Time:</label>
              <input
                type="time"
                name="shortBreak2EndTime-time"
                value={settings.shortBreak2EndTime.time}
                onChange={handleChange}
              />
              <select name="shortBreak2EndTime-period" value={settings.shortBreak2EndTime.period} onChange={handleChange}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>
        <h3>Period Timings</h3>
        <div className="period-timings">
          {periodTimings.map((timing, index) => (
            <div key={index} className="period-timing">
              <span>Period {timing.period}: </span>
              <span>{timing.start} - {timing.end}</span>
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
                      name="reserveTimeStart-time"
                      value={settings.reserveTimeStart.time}
                      onChange={handleChange}
                    />
                    <select name="reserveTimeStart-period" value={settings.reserveTimeStart.period} onChange={handleChange}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                    <span>to</span>
                    <input
                      type="time"
                      name="reserveTimeEnd-time"
                      value={settings.reserveTimeEnd.time}
                      onChange={handleChange}
                    />
                    <select name="reserveTimeEnd-period" value={settings.reserveTimeEnd.period} onChange={handleChange}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
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
                  name="reserveTimeStart-time"
                  value={settings.reserveTimeStart.time}
                  onChange={handleChange}
                />
                <select name="reserveTimeStart-period" value={settings.reserveTimeStart.period} onChange={handleChange}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reserve Time End:</label>
                <input
                  type="time"
                  name="reserveTimeEnd-time"
                  value={settings.reserveTimeEnd.time}
                  onChange={handleChange}
                />
                <select name="reserveTimeEnd-period" value={settings.reserveTimeEnd.period} onChange={handleChange}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
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
