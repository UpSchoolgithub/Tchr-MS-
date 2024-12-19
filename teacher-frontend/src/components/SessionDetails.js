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
    sessionDetails: initialSessionDetails, // Include sessionDetails from location.state
  } = location.state || {};
  
 
  const [expandedTopic, setExpandedTopic] = useState(null);

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
      console.log('Fetched session details:', response.data);
      setSessionDetails(response.data.sessions || null); // Adjust key if needed
    } catch (error) {
      console.error('Error fetching session details:', error);
      setError('Failed to fetch session details.');
    }
  };

  if (teacherId && sectionId && subjectId) fetchSessionDetails();
}, [teacherId, sectionId, subjectId]);

  
  // Track completed topics
const [completedTopics, setCompletedTopics] = useState([]);

// Handle checkbox change
const handleTopicChange = (topicName) => {
  setCompletedTopics((prev) => {
    const isCompleted = prev.includes(topicName);
    if (isCompleted) {
      return prev.filter((t) => t !== topicName);
    } else {
      return [...prev, topicName];
    }
  });
};

// Check if all topics are completed
const allTopicsCompleted =
  sessionDetails?.topics &&
  sessionDetails.topics.every((topic) => completedTopics.includes(topic.name));

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

  const handleEndSession = async () => {
    if (!sessionDetails || !sessionDetails.sessionPlanId) {
      alert('Session Plan ID is missing. Cannot end the session.');
      return;
    }
  
    // Collect completed and incomplete topics based on checkbox states
    const completedTopics = [];
    const incompleteTopics = [];
  
    sessionDetails.topics.forEach((topic, idx) => {
      const isChecked = document.getElementById(`topic-${idx}`).checked;
      if (isChecked) {
        completedTopics.push(topic);
      } else {
        incompleteTopics.push(topic);
      }
    });
  
    // Ensure at least one topic is completed
    if (completedTopics.length === 0) {
      alert('Please mark at least one topic as completed.');
      return;
    }
  
    try {
      const payload = {
        sessionPlanId: sessionDetails.sessionPlanId,
        completedTopics,
        incompleteTopics,
        observations,
        absentees,
        completed: true,
      };
  
      const response = await axiosInstance.post(
        `/teachers/${teacherId}/sessions/${sessionDetails.sessionId}/end`,
        payload
      );
  
      alert(response.data.message || 'Session ended successfully!');
      navigate(`/teacher-sessions/${teacherId}`);
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

        <div className="session-notes-section">
          <h3>Session Notes and Details:</h3>
          {sessionDetails ? (
            <div className="session-item">
              <p><strong>Session ID:</strong> {sessionDetails.sessionId || 'N/A'}</p>
              <p><strong>Chapter Name:</strong> {sessionDetails.chapterName || 'N/A'}</p>
              <div className="topics-container">
                <h4>Topics to Cover:</h4>
                {sessionDetails.topics && sessionDetails.topics.length > 0 ? (
                  <>
                    <div className="mark-all-container">
                      <input
                        type="checkbox"
                        id="mark-all"
                        checked={
                          sessionDetails.topics.length > 0 &&
                          completedTopics.length === sessionDetails.topics.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCompletedTopics(sessionDetails.topics.map((topic) => topic.name));
                          } else {
                            setCompletedTopics([]);
                          }
                        }}
                      />
                      <label htmlFor="mark-all">Mark All as Completed</label>
                    </div>
                    <ul className="topics-list">
                      {sessionDetails.topics.map((topic, idx) => (
                        <li key={idx} className="topic-item">
                          <div className="topic-container">
                            <input
                              type="checkbox"
                              id={`topic-${idx}`}
                              checked={completedTopics.includes(topic.name)}
                              onChange={() => handleTopicChange(topic.name)}
                            />
                            <label htmlFor={`topic-${idx}`} className="topic-name">
                              {idx + 1}. {topic.name}
                            </label>
                            <button
                              onClick={() => setExpandedTopic(expandedTopic === idx ? null : idx)}
                              className="view-lp-button"
                            >
                              {expandedTopic === idx ? "HIDE LP" : "VIEW LP"}
                            </button>
                          </div>
                          {expandedTopic === idx && (
                            <div className="lesson-plan-container">
                              <div className="lesson-plan-content">
                                <h5><strong>Concept:</strong> {topic.concept || "N/A"}</h5>
                                <p><strong>Detailing:</strong> {topic.detailing || "N/A"}</p>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>No topics available for this session.</p>
                )}
              </div>
              <button onClick={handleSaveObservations} className="save-observations-button">
                Save Observations
              </button>
              <button onClick={handleEndSession} className="end-session-button">
                End Session
              </button>
            </div>
          ) : (
            <p>No session details available for today.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
