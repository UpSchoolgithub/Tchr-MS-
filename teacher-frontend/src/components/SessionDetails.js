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
  const [topics, setTopics] = useState([]); // Topics for the session
  const [assignments, setAssignments] = useState(false); // Assignment status
  const [observations, setObservations] = useState(''); // Session observations

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

  // Fetch session topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axiosInstance.get(
          `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/topics`
        );
        setTopics(response.data);
      } catch (error) {
        console.error('Error fetching topics:', error);
      }
    };

    if (schoolId && classId && sectionId && subjectId) fetchTopics();
  }, [schoolId, classId, sectionId, subjectId]);

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

  const handleAssignmentChange = (e) => {
    setAssignments(e.target.value === 'yes');
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

        {/* Right Side: Session Notes */}
        <div className="session-notes-section">
          <h3>Session Notes and Details:</h3>
          <p><strong>Day:</strong> {day || 'Not Available'}</p>
          <p><strong>Period:</strong> {period || 'Not Available'}</p>

          <h4>Topics to Cover:</h4>
          <ul>
            {topics.length > 0 ? (
              topics.map((topic, index) => (
                <li key={index}>
                  <input type="checkbox" id={`topic-${index}`} name={`topic-${index}`} />
                  <label htmlFor={`topic-${index}`}>{topic.name}</label>
                </li>
              ))
            ) : (
              <p>No topics available for this session.</p>
            )}
          </ul>

          <h4>Assignments:</h4>
          <select onChange={handleAssignmentChange} defaultValue="no">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>

          {assignments && (
            <div className="assignment-input">
              <label htmlFor="assignment-details">Enter Assignment Details:</label>
              <textarea id="assignment-details" placeholder="Provide assignment details here..."></textarea>
            </div>
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
