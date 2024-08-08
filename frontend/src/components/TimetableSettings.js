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
    schoolEndTime: { time: '', period: 'PM' },
    assemblyStartTime: { time: '', period: 'AM' },
    assemblyEndTime: { time: '', period: 'AM' },
    lunchStartTime: { time: '', period: 'AM' },
    lunchEndTime: { time: '', period: 'PM' },
    shortBreak1StartTime: { time: '', period: 'AM' },
    shortBreak1EndTime: { time: '', period: 'AM' },
    shortBreak2StartTime: { time: '', period: 'PM' },
    shortBreak2EndTime: { time: '', period: 'PM' },
    reserveType: 'time',
    reserveDay: {},
    reserveTimeStart: { time: '', period: 'PM' },
    reserveTimeEnd: { time: '', period: 'PM' },
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

    let currentStartTime = assemblyEndTime;
    const timings = [];

    for (let i = 1; i <= periodsPerDay; i++) {
      let nextStartTime = addMinutes(currentStartTime, durationPerPeriod);

      if (nextStartTime > schoolEndTime) {
        alert('The periods exceed the school end time.');
        break;
      }

      if (isOverlapping(currentStartTime, nextStartTime, lunchStartTime, lunchEndTime)) {
        alert('A period is overlapping with lunch. Adjusting period to start after lunch.');
        currentStartTime = lunchEndTime;
        nextStartTime = addMinutes(currentStartTime, durationPerPeriod);
      } else if (isOverlapping(currentStartTime, nextStartTime, shortBreak1StartTime, shortBreak1EndTime)) {
        alert('A period is overlapping with Short Break 1. Adjusting period to start after the break.');
        currentStartTime = shortBreak1EndTime;
        nextStartTime = addMinutes(currentStartTime, durationPerPeriod);
      } else if (isOverlapping(currentStartTime, nextStartTime, shortBreak2StartTime, shortBreak2EndTime)) {
        alert('A period is overlapping with Short Break 2. Adjusting period to start after the break.');
        currentStartTime = shortBreak2EndTime;
        nextStartTime = addMinutes(currentStartTime, durationPerPeriod);
      }

      timings.push({ period: i, start: currentStartTime, end: nextStartTime });
      currentStartTime = nextStartTime;
    }

    setPeriodTimings(timings);
  };

  const addMinutes = (timeObj, minutes) => {
    const { time, period } = timeObj;
    let [hour, minute] = time.split(':').map(Number);
    hour = period === 'PM' && hour !== 12 ? hour + 12 : hour;
    hour = period === 'AM' && hour === 12 ? 0 : hour;
    const date = new Date(0, 0, 0, hour, minute);
    date.setMinutes(date.getMinutes() + minutes);
    const newHour = date.getHours();
    const newPeriod = newHour >= 12 ? 'PM' : 'AM';
    const formattedHour = newHour % 12 || 12;
    const formattedMinute = date.getMinutes().toString().padStart(2, '0');
    return { time: `${formattedHour}:${formattedMinute}`, period: newPeriod };
  };

  const isOverlapping = (start1, end1, start2, end2) => {
    const convertTo24Hour = (time, period) => {
      let [hour, minute] = time.split(':').map(Number);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return new Date(0, 0, 0, hour, minute);
    };
    const start1Date = convertTo24Hour(start1.time, start1.period);
    const end1Date = convertTo24Hour(end1.time, end1.period);
    const start2Date = convertTo24Hour(start2.time, start2.period);
    const end2Date = convertTo24Hour(end2.time, end2.period);
    return start1Date < end2Date && end1Date > start2Date;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [field, subField] = name.split('-');

    setSettings(prevSettings => ({
      ...prevSettings,
      [field]: {
        ...prevSettings[field],
        [subField]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const settingsToSave = {
        ...settings,
        reserveDay: JSON.stringify(settings.reserveDay),
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
              <div className="time-picker">
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
            </div>
            <div className="form-group">
              <label>School End Time:</label>
              <div className="time-picker">
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
            </div>
            <div className="form-group">
              <label>Assembly Start Time:</label>
              <div className="time-picker">
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
            </div>
            <div className="form-group">
              <label>Assembly End Time:</label>
              <div className="time-picker">
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
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Lunch Break Start Time:</label>
              <div className="time-picker">
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
            </div>
            <div className="form-group">
              <label>Lunch Break End Time:</label>
              <div className="time-picker">
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
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Short Break 1 Start Time:</label>
              <div className="time-picker">
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
            </div>
            <div className="form-group">
              <label>Short Break 1 End Time:</label>
              <div className="time-picker">
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
            </div>
            <div className="form-group">
              <label>Short Break 2 Start Time:</label>
              <div className="time-picker">
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
            </div>
            <div className="form-group">
              <label>Short Break 2 End Time:</label>
              <div className="time-picker">
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
        </div>
        <h3>Period Timings</h3>
        <div className="period-timings">
          {periodTimings.map((timing, index) => (
            <div key={index} className="period-timing">
              <span>Period {timing.period}: </span>
              <span>{timing.start.time} {timing.start.period} - {timing.end.time} {timing.end.period}</span>
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
                        <select name={`reserveDay-${day}-start-period`} value={settings.reserveDay[day]?.startPeriod || 'AM'} onChange={handleChange}>
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                        <span>to</span>
                        <input
                          type="time"
                          name={`reserveDay-${day}-end`}
                          value={settings.reserveDay[day]?.end || ''}
                          onChange={handleChange}
                        />
                        <select name={`reserveDay-${day}-end-period`} value={settings.reserveDay[day]?.endPeriod || 'AM'} onChange={handleChange}>
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
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
                <div className="time-picker">
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
              </div>
              <div className="form-group">
                <label>Reserve Time End:</label>
                <div className="time-picker">
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
