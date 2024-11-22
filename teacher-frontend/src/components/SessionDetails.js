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
    schoolId, // Added schoolId
    day,
    period,
  } = location.state || {};

  const [students, setStudents] = useState([]); // List of students
  const [absentees, setAbsentees] = useState([]); // Selected absentees
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error message
  const [chapterName, setChapterName] = useState('');
  const [assignments, setAssignments] = useState(false); // Assignment flag
  const [topics, setTopics] = useState([]); // Topics

  // Fetch students from the backend
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
    localStorage.setItem('absentees', JSON.stringify(selectedIds));
  };

  const handleSaveAttendance = async () => {
    const attendanceData = students.map((student) => ({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0], // Current date
      status: absentees.includes(student.rollNumber) ? 'A' : 'P',
    }));

    try {
      await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/attendance`,
        { attendanceData }
      );
      alert('Attendance saved successfully!');
      localStorage.removeItem('absentees');
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
      {/* Top-right details */}
      <div className="session-details-header">
        <p><strong>School ID:</strong> {schoolId}</p>
        <p><strong>Class ID:</strong> {classId}</p>
        <p><strong>Teacher ID:</strong> {teacherId}</p>
        <p><strong>Section ID:</strong> {sectionId}</p>
        <p><strong>Subject ID:</strong> {subjectId}</p>
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
          <p><strong>Session Number:</strong> 05</p>
          <p><strong>Chapter:</strong> {chapterName || 'No chapter specified'}</p>

          <h4>Topics to Cover:</h4>
          <ul>
            {topics.length > 0 ? (
              topics.map((topic, index) => (
                <li key={index}>
                  <input type="checkbox" id={`topic-${index}`} name={`topic-${index}`} />
                  <label htmlFor={`topic-${index}`}>{topic}</label>
                </li>
              ))
            ) : (
              <p>No topics available for this session.</p>
            )}
          </ul>

          <h4>Assignments:</h4>
          <select onChange={(e) => setAssignments(e.target.value === 'yes')} defaultValue="no">
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
            className="observations-textarea"
            placeholder="Add observations or notes here..."
          ></textarea>

          <button className="end-session-button">End Session</button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
