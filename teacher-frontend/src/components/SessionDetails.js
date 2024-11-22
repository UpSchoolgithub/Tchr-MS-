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
    schoolId,
  } = location.state || {};

  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [observations, setObservations] = useState('');
  const [assignmentsEnabled, setAssignmentsEnabled] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState('');
  const [existingFile, setExistingFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

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
        setSessionDetails(response.data.sessionDetails || null);
      } catch (error) {
        console.error('Error fetching session details:', error);
        setError('Failed to fetch session details.');
      }
    };

    if (teacherId && sectionId && subjectId) fetchSessionDetails();
  }, [teacherId, sectionId, subjectId]);

  // Fetch assignment details
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        if (sessionDetails?.sessionId) {
          const response = await axiosInstance.get(`/assignments/${sessionDetails.sessionId}`);
          setAssignmentDetails(response.data.assignmentDetails || '');
          setExistingFile(response.data.assignmentFileUrl || null);
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
      }
    };

    if (sessionDetails?.sessionId) fetchAssignmentDetails();
  }, [sessionDetails?.sessionId]);

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

  const handleAssignmentChange = (e) => {
    setAssignmentsEnabled(e.target.value === 'Yes');
  };

  const handleSaveAssignment = () => {
    if (!assignmentDetails.trim()) {
      alert('Assignment details cannot be empty.');
      return;
    }
  
    setSuccessMessage('Assignment saved successfully!');
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
          {sessionDetails ? (
            <div className="session-item">
              <p><strong>Chapter Name:</strong> {sessionDetails.chapterName || 'N/A'}</p>
              <p><strong>Session Number:</strong> {sessionDetails.sessionNumber || 'N/A'}</p>
              <h4>Topics to Cover:</h4>
              <ul>
                {sessionDetails.topics && sessionDetails.topics.length > 0 ? (
                  sessionDetails.topics.map((topic, idx) => (
                    <li key={idx}>
                      <input type="checkbox" id={`topic-${idx}`} />
                      <label htmlFor={`topic-${idx}`}>{topic}</label>
                    </li>
                  ))
                ) : (
                  <p>No topics available for this session.</p>
                )}
              </ul>
              <p><strong>Start Time:</strong> {sessionDetails.startTime || 'N/A'}</p>
              <p><strong>End Time:</strong> {sessionDetails.endTime || 'N/A'}</p>
              <p><strong>Session Date:</strong> {sessionDetails.sessionDate || 'N/A'}</p>
            </div>
          ) : (
            <p>No session details available for today.</p>
          )}

          {/* Assignment Section */}
          <h4>Assignments:</h4>
          {assignmentDetails && (
            <div>
              <p>Existing Assignment: {assignmentDetails}</p>
              {existingFile && (
                <p>
                  <a href={existingFile} target="_blank" rel="noopener noreferrer">
                    View Uploaded File
                  </a>
                </p>
              )}
            </div>
          )}
          <select onChange={handleAssignmentChange}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          {assignmentsEnabled && (
          <div className="assignment-input">
          <textarea
            value={assignmentDetails}
            onChange={(e) => setAssignmentDetails(e.target.value)}
            placeholder="Enter assignment details here..."
          ></textarea>
          <button onClick={handleSaveAssignment}>Save</button>
          {successMessage && <p className="success-message">{successMessage}</p>}
        </div>
        
        )}

          <h4>Observations:</h4>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="observations-textarea"
            placeholder="Add observations of the class here..."
          ></textarea>

          <button onClick={handleSaveObservations} className="save-observations-button">
            Save Observations
          </button>

          {/* Success message */}
          {successMessage && <p className="success-message">{successMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
