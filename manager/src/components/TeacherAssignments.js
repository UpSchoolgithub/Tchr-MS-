import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './TeacherAssignments.css';

const TeacherAssignments = () => {
  const { teacherId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [filters, setFilters] = useState({ school: '', class: '', subject: '', day: '' });
  const [uniqueSchools, setUniqueSchools] = useState([]);
  const [uniqueClasses, setUniqueClasses] = useState([]);
  const [uniqueSubjects, setUniqueSubjects] = useState([]);
  const [uniqueDays, setUniqueDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherName, setTeacherName] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
        setAssignments(response.data);
        setFilteredAssignments(response.data);
        extractUniqueFilters(response.data);
        
        // Fetch teacher's name for displaying in the PDF
        const teacherResponse = await axiosInstance.get(`/teachers/${teacherId}`);
        setTeacherName(teacherResponse.data.name);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setError('Failed to load assignments');
        setLoading(false);
      }
    };

    fetchAssignments();
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
    const filtered = assignments.filter(assignment => {
      return (
        (filters.school === '' || assignment.schoolName === filters.school) &&
        (filters.class === '' || assignment.className === filters.class) &&
        (filters.subject === '' || assignment.subjectName === filters.subject) &&
        (filters.day === '' || assignment.day === filters.day)
      );
    });
    setFilteredAssignments(filtered);
  }, [filters, assignments]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Teacher Time Table', doc.internal.pageSize.width / 2, 14, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Teacher: ${teacherName}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

    const tableData = filteredAssignments.map((assignment) => [
      assignment.schoolName,
      assignment.className,
      assignment.sectionName,
      assignment.day,
      assignment.period,
      assignment.subjectName,
      assignment.startTime,
      assignment.endTime,
    ]);

    doc.autoTable({
      head: [['School', 'Class', 'Section', 'Day', 'Period', 'Subject', 'Start Time', 'End Time']],
      body: tableData,
      theme: 'grid',
      styles: {
        halign: 'center', // Center-align content
      },
      headStyles: {
        fillColor: [22, 160, 133], // Optional: header color
        halign: 'center',
      },
      startY: 30, // Start the table below the title
      margin: { top: 20, bottom: 20 },
      tableWidth: 'auto',
    });

    doc.save(`${teacherName}_timetable.pdf`);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="assignments-container">
      <h2>Teacher Time Table</h2>

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
      <button onClick={downloadPDF}>Download Timetable</button>

      {/* Assignments Table */}
      {filteredAssignments.length === 0 ? (
        <p>No assignments found.</p>
      ) : (
        <table className="assignments-table">
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
            {filteredAssignments.map((assignment, index) => (
              <tr key={index}>
                <td>{assignment.schoolName}</td>
                <td>{assignment.className}</td>
                <td>{assignment.sectionName}</td>
                <td>{assignment.day}</td>
                <td>{assignment.period}</td>
                <td>{assignment.subjectName}</td>
                <td>{assignment.startTime}</td>
                <td>{assignment.endTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TeacherAssignments;
