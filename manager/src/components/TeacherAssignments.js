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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
        setAssignments(response.data);
        setFilteredAssignments(response.data); // Initially display all data
        setLoading(false);
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setError('Failed to load assignments');
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [teacherId]);

  // Filter assignments based on selected filters
  useEffect(() => {
    const filtered = assignments.filter(assignment => {
      return (
        (filters.school === '' || assignment.schoolName.includes(filters.school)) &&
        (filters.class === '' || assignment.className.toString() === filters.class) &&
        (filters.subject === '' || assignment.subjectName.includes(filters.subject)) &&
        (filters.day === '' || assignment.day.includes(filters.day))
      );
    });
    setFilteredAssignments(filtered);
  }, [filters, assignments]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Teacher Time Table', 14, 10);

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
    });

    doc.save('teacher_assignments.pdf');
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
          <input type="text" name="school" value={filters.school} onChange={handleFilterChange} />
        </label>
        <label>
          Class:
          <input type="text" name="class" value={filters.class} onChange={handleFilterChange} />
        </label>
        <label>
          Subject:
          <input type="text" name="subject" value={filters.subject} onChange={handleFilterChange} />
        </label>
        <label>
          Day:
          <input type="text" name="day" value={filters.day} onChange={handleFilterChange} />
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
