import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import './Session.css';

const Session = ({ teacherId }) => {
  const [sessions, setSessions] = useState([]);
  const [filters, setFilters] = useState({ school: '', class: '', subject: '', day: '' });
  const [uniqueSchools, setUniqueSchools] = useState([]);
  const [uniqueClasses, setUniqueClasses] = useState([]);
  const [uniqueSubjects, setUniqueSubjects] = useState([]);
  const [uniqueDays, setUniqueDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axiosInstance.get(`/teacherportal/${teacherId}/sessions`);
        setSessions(response.data);
        extractUniqueFilters(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setLoading(false);
      }
    };

    fetchSessions();
  }, [teacherId]);

  const extractUniqueFilters = (data) => {
    const schools = [...new Set(data.map(item => item.schoolName))];
    const classes = [...new Set(data.map(item => item.className))];
    const subjects = [...new Set(data.map(item => item.subjectName))];
    const days = [...new Set(data.map(item => item.day))];

    setUniqueSchools(schools);
    setUniqueClasses(classes);
    setUniqueSubjects(subjects);
    setUniqueDays(days);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredSessions = sessions.filter(session =>
    (filters.school === '' || session.schoolName === filters.school) &&
    (filters.class === '' || session.className === filters.class) &&
    (filters.subject === '' || session.subjectName === filters.subject) &&
    (filters.day === '' || session.day === filters.day)
  );

  if (loading) return <p>Loading...</p>;

  return (
    <div className="session-container">
      <h2>Teacher Sessions</h2>

      {/* Filters */}
      <div className="filters">
        <label>
          School:
          <select name="school" value={filters.school} onChange={handleFilterChange}>
            <option value="">All</option>
            {uniqueSchools.map((school, index) => (
              <option key={index} value={school}>{school}</option>
            ))}
          </select>
        </label>
        <label>
          Class:
          <select name="class" value={filters.class} onChange={handleFilterChange}>
            <option value="">All</option>
            {uniqueClasses.map((className, index) => (
              <option key={index} value={className}>{className}</option>
            ))}
          </select>
        </label>
        <label>
          Subject:
          <select name="subject" value={filters.subject} onChange={handleFilterChange}>
            <option value="">All</option>
            {uniqueSubjects.map((subject, index) => (
              <option key={index} value={subject}>{subject}</option>
            ))}
          </select>
        </label>
        <label>
          Day:
          <select name="day" value={filters.day} onChange={handleFilterChange}>
            <option value="">All</option>
            {uniqueDays.map((day, index) => (
              <option key={index} value={day}>{day}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Session Details Table */}
      {filteredSessions.length === 0 ? (
        <p>No sessions found.</p>
      ) : (
        <table className="session-table">
          <thead>
            <tr>
              <th>School</th>
              <th>Class</th>
              <th>Section</th>
              <th>Day</th>
              <th>Period</th>
              <th>Subject</th>
              <th>Start Time</th>
              <th>End Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((session, index) => (
              <tr key={index}>
                <td>{session.schoolName}</td>
                <td>{session.className}</td>
                <td>{session.sectionName}</td>
                <td>{session.day}</td>
                <td>{session.period}</td>
                <td>{session.subjectName}</td>
                <td>{session.startTime}</td>
                <td>{session.endTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Session;
