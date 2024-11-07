import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Session.css';
import { useParams } from 'react-router-dom';

const Session = () => {
  const { teacherId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [filters, setFilters] = useState({ school: '', class: '', subject: '', day: '' });
  const [uniqueSchools, setUniqueSchools] = useState([]);
  const [uniqueClasses, setUniqueClasses] = useState([]);
  const [uniqueSubjects, setUniqueSubjects] = useState([]);
  const [uniqueDays, setUniqueDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherName, setTeacherName] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Fetch the sessions for the teacher
        const response = await axiosInstance.get(`/teacherportal/${teacherId}/sessions`);
        setSessions(response.data);
        setFilteredSessions(response.data);
        extractUniqueFilters(response.data);

        // Fetch teacher's name for displaying in the PDF
        const teacherResponse = await axiosInstance.get(`/teachers/${teacherId}`);
        setTeacherName(teacherResponse.data.name);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError('Failed to load sessions');
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

  useEffect(() => {
    const filtered = sessions.filter(session => {
      return (
        (filters.school === '' || session.schoolName === filters.school) &&
        (filters.class === '' || session.className === filters.class) &&
        (filters.subject === '' || session.subjectName === filters.subject) &&
        (filters.day === '' || session.day === filters.day)
      );
    });
    setFilteredSessions(filtered);
  }, [filters, sessions]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Teacher Sessions', doc.internal.pageSize.width / 2, 14, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Teacher: ${teacherName}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

    const tableData = filteredSessions.map((session) => [
      session.schoolName,
      session.className,
      session.sectionName,
      session.day,
      session.period,
      session.subjectName,
      session.startTime,
      session.endTime,
    ]);

    doc.autoTable({
      head: [['School', 'Class', 'Section', 'Day', 'Period', 'Subject', 'Start Time', 'End Time']],
      body: tableData,
      theme: 'grid',
      styles: {
        halign: 'center',
      },
      headStyles: {
        fillColor: [22, 160, 133],
        halign: 'center',
      },
      startY: 30,
      margin: { top: 20, bottom: 20 },
      tableWidth: 'auto',
    });

    doc.save(`${teacherName}_sessions.pdf`);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

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

      {/* Download PDF Button */}
      <button onClick={downloadPDF}>Download Sessions</button>

      {/* Sessions Table */}
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
