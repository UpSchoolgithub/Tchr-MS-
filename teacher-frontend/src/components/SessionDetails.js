import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';

const SessionDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract data from navigation state
  const {
    teacherId,
    classId,
    sectionId,
    subjectId,
    day,
    period,
  } = location.state || {};

  const [students, setStudents] = useState([]); // List of students
  const [absentees, setAbsentees] = useState([]); // Selected absentees
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error message

  // Handle missing data
  if (!sectionId || !classId || !subjectId) {
    console.error('Missing critical data:', { sectionId, classId, subjectId });
    return (
      <div className="error-container">
        <p>Error: Missing critical data. Please navigate correctly.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  // Fetch students for the section
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        console.log('Fetching students for Section ID:', sectionId);
        const response = await axiosInstance.get(
          `/teachers/${teacherId}/sections/${sectionId}/students`
        );
        setStudents(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [teacherId, sectionId]);

  // Handle absentee selection
  const handleAbsenteeChange = (selectedOptions) => {
    const selectedIds = selectedOptions?.map((option) => option.value) || [];
    setAbsentees(selectedIds);
  };

  // Convert students to options for the dropdown
  const studentOptions = students.map((student) => ({
    value: student.rollNumber,
    label: student.studentName,
  }));

  // Save attendance
  const handleSaveAttendance = async () => {
    const attendanceData = students.map((student) => ({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0], // Current date
      status: absentees.includes(student.rollNumber) ? 'A' : 'P', // 'A' for absent, 'P' for present
    }));

    console.log('Saving attendance:', attendanceData);

    try {
      await axiosInstance.post(
        `/schools/${classId}/classes/${classId}/sections/${sectionId}/attendance`,
        { attendanceData }
      );
      alert('Attendance saved successfully!');
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Failed to save attendance. Please try again.');
    }
  };

  return (
    <div className="session-details-container">
      <h2>Session Details</h2>
      <div className="session-info">
        <p>
          <strong>Teacher ID:</strong> {teacherId}
        </p>
        <p>
          <strong>Class ID:</strong> {classId}
        </p>
        <p>
          <strong>Section ID:</strong> {sectionId}
        </p>
        <p>
          <strong>Subject ID:</strong> {subjectId}
        </p>
        <p>
          <strong>Day:</strong> {day}
        </p>
        <p>
          <strong>Period:</strong> {period}
        </p>
      </div>

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
              placeholder="Select Absentees"
              className="multi-select-dropdown"
              closeMenuOnSelect={false}
            />
            <button onClick={handleSaveAttendance} className="save-attendance-button">
              Save Attendance
            </button>
          </>
        )}

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
    </div>
  );
};

export default SessionDetails;
