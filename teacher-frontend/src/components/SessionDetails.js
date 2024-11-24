import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';

const SessionDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
  const [file, setFile] = useState(null); // File state
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
        if (sessionDetails?.sessionPlanId) {
          const response = await axiosInstance.get(`/assignments/${sessionDetails.sessionPlanId}`);
          setAssignmentDetails(response.data.assignmentDetails || '');
          setExistingFile(response.data.assignmentFileUrl || null);
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
      }
    };

    if (sessionDetails?.sessionPlanId) fetchAssignmentDetails();
  }, [sessionDetails?.sessionPlanId]);

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
    setAssignmentsEnabled(e.target.value === 'Yes');
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Update the file state
  };

  const handleSaveAssignment = async () => {
    try {
        const formData = new FormData();
        formData.append('sessionPlanId', sessionDetails?.sessionPlanId); // Include sessionPlanId
        formData.append('assignmentDetails', assignmentDetails); // Include assignment details
        if (file) {
            formData.append('file', file); // Optional: Include the file only if selected
        }

        const response = await axiosInstance.post('/api/assignments', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        alert('Assignment saved successfully!');
        setSuccessMessage(response.data.message);
    } catch (error) {
        console.error('Error saving assignment:', error);
        alert('Failed to save assignment.');
    }
};

  
  

  const handleSaveObservations = async () => {
    try {
      const response = await axiosInstance.post('/api/observations', {
        sessionPlanId: sessionDetails?.sessionPlanId,
        observations,
      });
      alert('Observations saved successfully!');
    } catch (error) {
      console.error('Error saving observations:', error);
      alert('Failed to save observations.');
    }
  };

  //to save session details 
  const handleEndSession = async () => {
    if (!sessionDetails || !sessionDetails.sessionPlanId) {
      alert('Session Plan ID is missing. Cannot end the session.');
      console.error('Session Plan ID is missing:', sessionDetails);
      return;
    }
  
    try {
      const completedTopics = [];
      const uncompletedTopics = [];
  
      sessionDetails.topics.forEach((topic, idx) => {
        const checkbox = document.getElementById(`topic-${idx}`);
        if (checkbox?.checked) {
          completedTopics.push(topic);
        } else {
          uncompletedTopics.push(topic);
        }
      });
  
      const payload = {
        completedTopics,
        incompleteTopics: uncompletedTopics,
        assignmentDetails: assignmentsEnabled ? assignmentDetails : null,
        observations,
      };
  
      await axiosInstance.post(
        `/teachers/${teacherId}/sessions/${sessionDetails.sessionPlanId}/end`,
        payload
      );
  
      alert('Session ended successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end the session.');
    }
  };
  
  
  const studentOptions = students.map((student) => ({
    value: student.rollNumber,
    label: student.studentName,
  }));


  return (
    <div className="session-details-container">
      <div className="session-details-header">
        <p><strong>School ID:</strong> {schoolId || 'Not Available'}</p>
        <p><strong>Class ID:</strong> {classId || 'Not Available'}</p>
        <p><strong>Teacher ID:</strong> {teacherId || 'Not Available'}</p>
        <p><strong>Section ID:</strong> {sectionId || 'Not Available'}</p>
        <p><strong>Subject ID:</strong> {subjectId || 'Not Available'}</p>
      </div>

      <h2>Welcome, Teacher Name!</h2>

      <div className="attendance-and-notes">
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
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.doc,.docx,.jpg,.png" // Optional: Restrict file types
            />
            <button onClick={handleSaveAssignment}>Save</button>
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
          <div className="end-session">
            <button onClick={handleEndSession} className="end-session-button">
              End Session
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
