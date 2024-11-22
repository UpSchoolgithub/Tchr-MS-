import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';

const SessionDetails = () => {
  const location = useLocation();

  // Extract data from navigation state
  const {
    teacherId,
    classId,
    sectionId,
    subjectId,
    schoolId,
    day,
    period,
  } = location.state || {};

  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch students for attendance
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          `/teachers/${teacherId}/sections/${sectionId}/students`
        );
        setStudents(response.data);
      } catch (error) {
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) fetchStudents();
    else setError('Section ID is missing.');
  }, [teacherId, sectionId]);

  const handleAbsenteeChange = (selectedOptions) => {
    const selectedIds = selectedOptions?.map((option) => option.value) || [];
    setAbsentees(selectedIds);
  };

  const handleSaveAttendance = async () => {
    const attendanceData = students.map((student) => ({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      status: absentees.includes(student.rollNumber) ? 'A' : 'P',
    }));

    try {
      await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/attendance`,
        { attendanceData }
      );
      alert('Attendance saved successfully!');
    } catch (error) {
      alert('Failed to save attendance.');
    }
  };

  const studentOptions = students.map((student) => ({
    value: student.rollNumber,
    label: student.studentName,
  }));

  return (
    <div className="session-details-container">
      {/* Top-right IDs */}
      <div className="session-details-header">
        <p><strong>School ID:</strong> {schoolId || 'Not Available'}</p>
        <p><strong>Class ID:</strong> {classId || 'Not Available'}</p>
        <p><strong>Teacher ID:</strong> {teacherId || 'Not Available'}</p>
        <p><strong>Section ID:</strong> {sectionId || 'Not Available'}</p>
        <p><strong>Subject ID:</strong> {subjectId || 'Not Available'}</p>
      </div>

      <h2>Welcome, Teacher Name!</h2>

      <div className="attendance-and-notes">
        {/* Left Side: Mark Attendance */}
        <div className="attendance-section">
          <h3>Mark Attendance</h3>
          {loading ? (
            <p>Loading students...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : students.length === 0 ? (
            <p>No students found for this section.</p>
          ) : (
            <>
              <Select
                isMulti
                options={studentOptions}
                onChange={handleAbsenteeChange}
                placeholder="Choose Absentees"
                value={studentOptions.filter((option) => absentees.includes(option.value))}
                className="multi-select-dropdown"
                closeMenuOnSelect={false}
              />
              <button onClick={handleSaveAttendance} className="save-attendance-button">
                Save Attendance
              </button>
            </>
          )}

          {/* Absentee List */}
          {absentees.length > 0 && (
            <div className="absentees-list">
              <h4>List of Absentees:</h4>
              <ul>
                {absentees.map((id) => {
                  const student = studentOptions.find((s) => s.value === id);
                  return <li key={id}>{student?.label || 'Unknown'} (Absent)</li>;
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Right Side: Session Notes */}
        <div className="session-notes-section">
          <h3>Session Notes and Details:</h3>
          <p><strong>Day:</strong> {day || 'Not Available'}</p>
          <p><strong>Period:</strong> {period || 'Not Available'}</p>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
