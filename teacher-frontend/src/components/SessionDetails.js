import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useParams } from 'react-router-dom'; // Import useParams
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';

const SessionDetails = () => {
  const { teacherId, sectionId, sessionId } = useParams(); // Extract parameters from the route
  const [students, setStudents] = useState([]); // List of students
  const [absentees, setAbsentees] = useState([]); // Selected absentees
  const [assignments, setAssignments] = useState(false); // Assignment flag
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error message

  // Fetch students from the backend
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axiosInstance.get(
          `/teachers/${teacherId}/sections/${sectionId}/students`
        );
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) {
      fetchStudents();
    } else {
      setError('Section ID is missing.');
    }
  }, [teacherId, sectionId]);

  // Handle changes to the absentee selection
  const handleAbsenteeChange = (selectedOptions) => {
    const selectedIds = selectedOptions?.map((option) => option.value) || [];
    setAbsentees(selectedIds);
  };

  // Handle assignment dropdown change
  const handleAssignmentsChange = (e) => {
    setAssignments(e.target.value === 'yes');
  };

  // Convert students to options for the dropdown
  const studentOptions = students.map((student) => ({
    value: student.rollNumber,
    label: student.studentName,
  }));

  const handleSaveAttendance = async () => {
    const attendanceData = students.map((student) => ({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0], // Current date
      status: absentees.includes(student.rollNumber) ? 'A' : 'P',
    }));
  
    console.log('Saving attendance:', attendanceData); // Debugging log
  
    try {
      await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/attendance`,
        { attendanceData }
      );
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance');
    }
  };
  
  
  return (
    <div className="session-details-container">
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
            <Select
              isMulti
              options={studentOptions}
              onChange={handleAbsenteeChange}
              placeholder="Choose Absentees"
              value={studentOptions.filter((option) => absentees.includes(option.value))}
              className="multi-select-dropdown"
              closeMenuOnSelect={false}
              isClearable
            />
          )}

          {/* Display absentees list only if absentees are selected */}
          {absentees.length > 0 && (
            <div className="absentees-list">
              <h4>List of Absentees:</h4>
              <ul>
                {absentees.map((id) => {
                  const student = studentOptions.find((s) => s.value === id);
                  return (
                    <li key={id}>
                      {student?.label || 'Unknown'}{' '}
                      <span style={{ color: 'red' }}>Absent</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <button onClick={handleSaveAttendance} className="save-attendance-button">
          Save Attendance
        </button>

        {/* Right Side: Session Notes and Details */}
        <div className="session-notes-section">
          <h3>Session Notes and Details:</h3>
          <p>
            <strong>Session Number:</strong> 05
          </p>
          <p>
            <strong>Chapter:</strong> Respiration in Plants
          </p>

          <h4>Topics to Cover:</h4>
          <ul>
            <li>
              <input type="checkbox" /> Topic 1
            </li>
            <li>
              <input type="checkbox" /> Topic 2
            </li>
            <li>
              <input type="checkbox" /> Topic 3
            </li>
          </ul>

          <h4>Assignments:</h4>
          <select onChange={handleAssignmentsChange} defaultValue="no">
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
