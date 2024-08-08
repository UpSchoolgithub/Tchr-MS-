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
    schoolStartTime: '08:00 AM',
    schoolEndTime: '04:00 PM',
    assemblyStartTime: '08:00 AM',
    assemblyEndTime: '08:15 AM',
    lunchStartTime: '12:00 PM',
    lunchEndTime: '12:45 PM',
    shortBreak1StartTime: '10:00 AM',
    shortBreak1EndTime: '10:10 AM',
    shortBreak2StartTime: '02:15 PM',
    shortBreak2EndTime: '02:25 PM',
    reserveType: 'time',
    reserveDay: {},
    reserveTimeStart: '',
    reserveTimeEnd: '',
    applyToAll: false,
  });
  const [periodTimings, setPeriodTimings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch settings from API or use default settings
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
    } else {
      calculateDefaultTimetable();
    }
  }, [schoolId]);

  useEffect(() => {
    if (settings.schoolEndTime && settings.assemblyEndTime && settings.durationPerPeriod) {
      calculatePeriodTimings();
    }
  }, [settings.periodsPerDay, settings.durationPerPeriod, settings.assemblyEndTime]);

  const calculateDefaultTimetable = () => {
    const defaultTimings = calculatePeriodTimings();
    setPeriodTimings(defaultTimings);
  };

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
      schoolEndTime,
    } = settings;

    let currentStartTime = assemblyEndTime;
    const timings = [];

    for (let i = 1; i <= periodsPerDay; i++) {
      let nextStartTime = addMinutes(currentStartTime, durationPerPeriod);

      if (convertToAmPm(nextStartTime) > convertToAmPm(schoolEndTime)) {
        alert('The periods exceed the school end time.');
        break;
      }

      if (isOverlapping(currentStartTime, nextStartTime, lunchStartTime, lunchEndTime)) {
        timings.push({ period: 'Lunch Break', start: lunchStartTime, end: lunchEndTime });
        currentStartTime = lunchEndTime;
        nextStartTime = addMinutes(currentStartTime, durationPerPeriod);
      } else if (isOverlapping(currentStartTime, nextStartTime, shortBreak1StartTime, shortBreak1EndTime)) {
        timings.push({ period: 'Short Break 1', start: shortBreak1StartTime, end: shortBreak1EndTime });
        currentStartTime = shortBreak1EndTime;
        nextStartTime = addMinutes(currentStartTime, durationPerPeriod);
      } else if (isOverlapping(currentStartTime, nextStartTime, shortBreak2StartTime, shortBreak2EndTime)) {
        timings.push({ period: 'Short Break 2', start: shortBreak2StartTime, end: shortBreak2EndTime });
        currentStartTime = shortBreak2EndTime;
        nextStartTime = addMinutes(currentStartTime, durationPerPeriod);
      }

      timings.push({ period: i, start: currentStartTime, end: nextStartTime });
      currentStartTime = nextStartTime;
    }

    setPeriodTimings(timings);
    return timings;
  };

  const addMinutes = (time, minutes) => {
    const [hour, minute] = time.split(':').map(Number);
    const date = new Date(0, 0, 0, hour, minute);
    date.setMinutes(date.getMinutes() + minutes);
    return convertToAmPm(date.toTimeString().slice(0, 5));
  };

  const convertToAmPm = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const adjustedHour = hour % 12 || 12;
    return `${adjustedHour}:${minute < 10 ? '0' + minute : minute} ${ampm}`;
  };

  const isOverlapping = (start1, end1, start2, end2) => {
    return start1 < end2 && end1 > start2;
  };

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

  const handleChangeTime = (value, field) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [field]: value,
    }));
  };

  const isWithinSchoolHours = (startTime, endTime) => {
    return (
      convertToAmPm(startTime) >= convertToAmPm(settings.schoolStartTime) &&
      convertToAmPm(endTime) <= convertToAmPm(settings.schoolEndTime)
    );
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
    new Date(`1970-01-01T${shortBreak2EndTime}:00`) > new Date(`1970-01-01T${schoolEndTime}:00`) ||
    new Date(`1970-01-01T${periodEndTime}:00`) > new Date(`1970-01-01T${schoolEndTime}:00`))) {
    
      return 'All activities should end before School End Time.';
    }

    // Check reserve time
    if (settings.reserveTimeStart && settings.reserveTimeEnd) {
      if (!isWithinSchoolHours(settings.reserveTimeStart, settings.reserveTimeEnd)) {
        return 'Reserve time should be within or after school hours.';
      }
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
              <TimePicker
                onChange={(value) => handleChangeTime(value, 'schoolStartTime')}
                value={settings.schoolStartTime}
                format="h:mm a"
                disableClock
              />
            </div>
            <div className="form-group">
              <label>School End Time:</label>
              <TimePicker
                onChange={(value) => handleChangeTime(value, 'schoolEndTime')}
                value={settings.schoolEndTime}
                format="h:mm a"
                disableClock
              />
            </div>
            <div className="form-group">
              <label>Assembly Start Time:</label>
              <TimePicker
                onChange={(value) => handleChangeTime(value, 'assemblyStartTime')}
                value={settings.assemblyStartTime}
                format="h:mm a"
                disableClock
              />
            </div>
            <div className="form-group">
              <label>Assembly End Time:</label>
              <TimePicker
                onChange={(value) => handleChangeTime(value, 'assemblyEndTime')}
                value={settings.assemblyEndTime}
                format="h:mm a"
                disableClock
              />
            </div>
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Lunch Break Start Time:</label>
              <TimePicker
                onChange={(value) => handleChangeTime(value, 'lunchStartTime')}
                value={settings.lunchStartTime}
                format="h:mm a"
                disableClock
              />
            </div>
            <div className="form-group">
              <label>Lunch Break End Time:</label>
              <TimePicker
                onChange={(value) => handleChangeTime(value, 'lunchEndTime')}
                value={settings.lunchEndTime}
                format="h:mm a"
                disableClock
              />
            </div>
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Short Break 1 Start Time:</label>
              <TimePicker
                onChange={(value) => handleChangeTime(value, 'shortBreak1StartTime')}
                value={settings.shortBreak1StartTime}
                format="h:mm a"
                disableClock
              />
            </div>
            <div className="form-group">
              <label>Short Break 1 End Time:</label>
              <TimePicker
                onChange={(value) => handleChangeTime(value, 'shortBreak1EndTime')}
                value={settings.shortBreak1EndTime}
                format="h:mm a"
                disableClock
              />
            </div>
            <div className="form-group">
              <label>Short Break 2 Start Time:</label>
              <TimePicker
                onChange={(value) => handleChangeTime(value, 'shortBreak2StartTime')}
                value={settings.shortBreak2StartTime}
                format="h:mm a"
                disableClock
              />
            </div>
            <div className="form-group">
              <label>Short Break 2 End Time:</label>
              <TimePicker
                onChange={(value) => handleChangeTime(value, 'shortBreak2EndTime')}
                value={settings.shortBreak2EndTime}
                format="h:mm a"
                disableClock
              />
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
                        <TimePicker
                          onChange={(value) => handleChangeTime(value, `reserveDay-${day}-start`)}
                          value={settings.reserveDay[day]?.start || ''}
                          format="h:mm a"
                          disableClock
                        />
                        <span>to</span>
                        <TimePicker
                          onChange={(value) => handleChangeTime(value, `reserveDay-${day}-end`)}
                          value={settings.reserveDay[day]?.end || ''}
                          format="h:mm a"
                          disableClock
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
                    <TimePicker
                      onChange={(value) => handleChangeTime(value, 'reserveTimeStart')}
                      value={settings.reserveTimeStart}
                      format="h:mm a"
                      disableClock
                    />
                    <span>to</span>
                    <TimePicker
                      onChange={(value) => handleChangeTime(value, 'reserveTimeEnd')}
                      value={settings.reserveTimeEnd}
                      format="h:mm a"
                      disableClock
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
                <TimePicker
                  onChange={(value) => handleChangeTime(value, 'reserveTimeStart')}
                  value={settings.reserveTimeStart}
                  format="h:mm a"
                  disableClock
                />
              </div>
              <div className="form-group">
                <label>Reserve Time End:</label>
                <TimePicker
                  onChange={(value) => handleChangeTime(value, 'reserveTimeEnd')}
                  value={settings.reserveTimeEnd}
                  format="h:mm a"
                  disableClock
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

