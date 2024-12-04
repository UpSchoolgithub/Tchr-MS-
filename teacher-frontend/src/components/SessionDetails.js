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
  // Fetch session details
useEffect(() => {
  const fetchSessionDetails = async () => {
    try {
      const response = await axiosInstance.get(
        `/teachers/${teacherId}/sections/${sectionId}/subjects/${subjectId}/sessions`
      );
      console.log('Fetched session details:', response.data);
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
 
      {/* Welcome Message */}
      <h2>Welcome, Vishal!</h2>
  
      {/* Attendance Section */}
      <div className="attendance-section">
        <h3>Mark Absentees</h3>
        <p style={{ color: 'red', fontSize: 'small' }}>
    <i>*Note: Mark only absentees. Rest of the students will be marked present automatically</i>
</p>
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
  
        {/* Session Notes */}
        <div className="session-notes-section">
  <strong>
    <h3
      style={{
        textAlign: "center",
        textTransform: "uppercase",
        textDecoration: "underline",
        fontWeight: "bold",
      }}
    >
      Session Notes and Details:
    </h3>
  </strong>
  {loading ? (
    <p>Loading session details...</p>
  ) : error ? (
    <p className="error-message">{error}</p>
  ) : sessionDetails && Array.isArray(sessionDetails.topics) && sessionDetails.topics.length > 0 ? (
    <div className="session-item">
      <p>
        <strong>Chapter Name:</strong> {sessionDetails.chapterName || "N/A"}
      </p>
      <p>
        <strong>Session Number:</strong> {sessionDetails.sessionNumber || "N/A"}
      </p>
      <div className="topics-container">
        <h4>Topics to Cover:</h4>

        {/* Recommended Topics Section */}
        <div className="recommended-topics-box">
          <h3>Recommended Topics to Cover from A&R:</h3>
          <div className="recommended-topic-item">
            <input type="checkbox" id="electric-current" />
            <label htmlFor="electric-current">Electric Current</label>
          </div>
        </div>

        {/* Topics List */}
        <ul className="topics-list">
          {sessionDetails.topics.map((topic, idx) => (
            <li key={idx} className="topic-item">
              <div className="topic-container">
                <input
                  type="checkbox"
                  id={`topic-${idx}`}
                  style={{ marginRight: "10px" }}
                />
                <label htmlFor={`topic-${idx}`} className="topic-name">
                  {idx + 1}. {topic}
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
                    <div className="section-box">
                      <h5>
                        <strong>Objectives:</strong>
                      </h5>
                      <ul>
                        <li>Understand the concept of resistors connected in parallel.</li>
                        <li>Learn about the equivalent resistance formula for resistors in parallel.</li>
                        <li>Understand how current flows in resistors connected in parallel.</li>
                      </ul>
                    </div>
                    <div className="section-box">
                      <h5>
                        <strong>Teaching Aids:</strong>
                      </h5>
                      <p>Whiteboard, Markers, Visual aids (diagrams)</p>
                    </div>
                    <div className="section-box">
                      <h5>
                        <strong>Content:</strong>
                      </h5>
                      <ol>
                        <li>
                          <strong>Introduction to resistors in parallel:</strong>
                          <ul>
                            <li>Definition and explanation of resistors connected in parallel.</li>
                            <li>Differences between series and parallel connections of resistors.</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Equivalent resistance in parallel:</strong>
                          <ul>
                            <li>Explanation of how to calculate the total resistance in a parallel circuit.</li>
                            <li>Formula for calculating equivalent resistance in a parallel circuit.</li>
                            <li>Example problems demonstrating the calculation of equivalent resistance.</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Current flow in resistors in parallel:</strong>
                          <ul>
                            <li>Explanation of how current is distributed in resistors connected in parallel.</li>
                            <li>Illustration using diagrams to show the flow of current in parallel resistors.</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                    <div className="section-box">
                      <h5>
                        <strong>Activities:</strong>
                      </h5>
                      <ol>
                        <li>
                          Solve example problems related to calculating equivalent resistance in parallel circuits.
                        </li>
                        <li>Draw diagrams showing the flow of current in parallel resistors.</li>
                        <li>Discuss real-life examples of parallel circuits and their applications.</li>
                      </ol>
                    </div>
                    <div className="section-box">
                      <h5>
                        <strong>Summary:</strong>
                      </h5>
                      <p>
                        Recap the key points discussed during the session. Emphasize the differences between series and
                        parallel connections of resistors. Highlight the significance of understanding resistors in
                        parallel in practical applications.
                      </p>
                    </div>
                    <div className="section-box">
                      <h5>
                        <strong>Homework:</strong>
                      </h5>
                      <ul>
                        <li>Solve additional practice problems on resistors in parallel.</li>
                        <li>Research and list examples of everyday devices that use parallel resistor configurations.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <p>
        <strong>Start Time:</strong> {sessionDetails.startTime || "N/A"}
      </p>
      <p>
        <strong>End Time:</strong> {sessionDetails.endTime || "N/A"}
      </p>
      <p>
        <strong>Session Date:</strong> {sessionDetails.sessionDate || "N/A"}
      </p>
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
