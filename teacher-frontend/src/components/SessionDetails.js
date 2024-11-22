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
  } = location.state || {};

  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionDetails, setSessionDetails] = useState([]); // Store session details
  const [observations, setObservations] = useState('');

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

  // Fetch session details
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/teachers/${teacherId}/sections/${sectionId}/subjects/${subjectId}/sessions`
        );
        setSessionDetails(response.data.sessions || []);
      } catch (error) {
        console.error('Error fetching session details:', error);
        setError('Failed to fetch session details.');
      }
    };

    if (teacherId && sectionId && subjectId) fetchSessionDetails();
  }, [teacherId, sectionId, subjectId]);

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

  const handleSaveObservations = () => {
    alert(`Observations Saved: ${observations}`);
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
        </div>

        {/* Right Side: Session Details */}
        <div className="session-notes-section">
          <h3>Session Notes and Details:</h3>
          {sessionDetails.length > 0 ? (
            sessionDetails.map((session, index) => (
              <div key={index} className="session-item">
                <p><strong>Chapter Name:</strong> {session.chapter || 'N/A'}</p>
                <p><strong>Session Number:</strong> {session.sessionNumber || 'N/A'}</p>
                <h4>Topics:</h4>
                <ul>
                  {session.topics.length > 0 ? (
                    session.topics.map((topic, idx) => <li key={idx}>{topic}</li>)
                  ) : (
                    <p>No topics available for this session.</p>
                  )}
                </ul>
              </div>
            ))
          ) : (
            <p>No session details available.</p>
          )}

          <h4>Observations:</h4>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="observations-textarea"
            placeholder="Add observations or notes here..."
          ></textarea>

          <button onClick={handleSaveObservations} className="save-observations-button">
            Save Observations
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
