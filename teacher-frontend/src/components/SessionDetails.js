import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';
import moment from 'moment'; // Install this library for date formatting

const SessionDetails = () => {
  const location = useLocation(); // Correctly use useLocation
  const navigate = useNavigate();

  const {
    teacherId = null,
    classId = null,
    sectionId = null,
    subjectId = null,
    schoolId = null,
    sessionDetails: initialSessionDetails = [],
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
  const [file, setFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [topicCompletion, setTopicCompletion] = useState({});
  
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
    // Adjust the filtering logic to handle missing sessions for today
const fetchSessionDetails = async () => {
  try {
    const response = await axiosInstance.get(
      `/teachers/${teacherId}/sections/${sectionId}/subjects/${subjectId}/sessions`
    );

    console.log('API Response:', response.data); // Log the raw API response

    const todayDate = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    console.log('Today Date:', todayDate);

    // Filter sessions for today
    let sessions = response.data.sessions.filter((session) => {
      const sessionDate = new Date(session.sessionDate).toISOString().split('T')[0]; // Convert sessionDate to YYYY-MM-DD
      console.log('Session Date:', sessionDate, 'Today Date:', todayDate, 'Match:', sessionDate === todayDate);
      return sessionDate === todayDate;
    });

    // Fallback to show the latest session if no session is found for today
    if (sessions.length === 0 && response.data.sessions.length > 0) {
      console.warn('No sessions found for today. Falling back to the most recent session.');
      sessions = [response.data.sessions[0]]; // Fallback to the first session
    }

    if (sessions.length === 0) {
      setError('No sessions found.');
      console.log('No sessions found.');
      return;
    }

    console.log('Filtered Sessions:', sessions);

    const processedSessions = sessions.map((session) => ({
      ...session,
      sessionPlanId: session.sessionPlanId || session.sessionPlanId, // Ensure sessionPlanId is included
      topics: (session.topics || []).map((topic) => ({
        ...topic,
        completed: false,
        concepts: (topic.details || []).map((detail) => ({
          name: detail.concept,
          detailing: detail.conceptDetailing,
          lessonPlans: (detail.lessonPlans || []).map((plan) => {
            const objectivesIndex = plan.indexOf('Objectives');
            return objectivesIndex !== -1 ? plan.substring(objectivesIndex) : plan;
          }),
          completed: false,
        })),
      })),
    }));
    

    setSessionDetails(processedSessions);
    console.log('Processed Session Details:', processedSessions);
  } catch (err) {
    setError('Failed to fetch session details.');
    console.error('Error Fetching Sessions:', err);
  }
};

    
  
    if (teacherId && sectionId && subjectId) {
      fetchSessionDetails();
    }
  }, [teacherId, sectionId, subjectId]);
  

  // Track completed topics
  const [completedTopics, setCompletedTopics] = useState([]);

  // Handle checkbox change
  const handleTopicChange = (sessionIndex, topicIndex) => {
    setSessionDetails((prevDetails) => {
      const updatedDetails = prevDetails.map((session, idx) =>
        idx === sessionIndex
          ? {
              ...session,
              topics: session.topics.map((topic, tIdx) =>
                tIdx === topicIndex
                  ? { ...topic, completed: !topic.completed }
                  : topic
              ),
            }
          : session
      );
      return updatedDetails;
    });
  };
  
  const handleConceptChange = (sessionIndex, topicIndex, conceptIndex) => {
    setSessionDetails((prevDetails) => {
      const updatedDetails = prevDetails.map((session, sIdx) =>
        sIdx === sessionIndex
          ? {
              ...session,
              topics: session.topics.map((topic, tIdx) =>
                tIdx === topicIndex
                  ? {
                      ...topic,
                      concepts: topic.concepts.map((concept, cIdx) =>
                        cIdx === conceptIndex
                          ? { ...concept, completed: !concept.completed }
                          : concept
                      ),
                      completed: topic.concepts.every(
                        (concept, cIdx) =>
                          cIdx === conceptIndex
                            ? !concept.completed // Toggle current concept
                            : concept.completed
                      ),
                    }
                  : topic
              ),
            }
          : session
      );
      return updatedDetails;
    });
  };
  
  

  const handleTopicExpand = (index) => {
    setExpandedTopic((prev) => (prev === index ? null : index));
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
    setFile(e.target.files[0]);
  };

  const handleSaveAssignment = async () => {
    try {
      const formData = new FormData();
      formData.append('sessionPlanId', sessionDetails?.sessionPlanId);
      formData.append('assignmentDetails', assignmentDetails);
      if (file) {
        formData.append('file', file);
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
    if (!sessionDetails || !sessionDetails[0]?.sessionId) {
      alert('Session ID is missing. Cannot end the session.');
      return;
    }
  
    const payload = {
      completedConcepts: completedTopics,
      incompleteConcepts: incompleteTopics,
    };
  
    try {
      const response = await axiosInstance.post(
        `/teachers/${teacherId}/sessions/${sessionDetails[0]?.sessionId}/end`,
        payload
      );
  
      alert(response.data.message || 'Session ended successfully!');
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

    <div className="session-notes-section">
  <h3>Session Notes and Details:</h3>
  {sessionDetails && sessionDetails.length > 0 ? (
    sessionDetails.map((session, sessionIndex) => (
      <div key={sessionIndex} className="session-item">

        <p><strong>Chapter Name:</strong> {session.chapterName || 'N/A'}</p>
        <p><strong>Status:</strong> {session.completed ? 'Completed' : 'Incomplete'}</p>
{/* Recommended Topics Section 
<div className="recommended-topics-box">
  <h3>Recommended Topics to Cover from A&R:</h3>
  <div className="recommended-topic-item">
    <input
      type="checkbox"
      id={`Introduction to Economic Growth-${sessionIndex}`}
    />
    <label htmlFor={`Introduction to Economic Growth-${sessionIndex}`}>Introduction to Economic Growth</label>
  </div>
</div>*/}


      <h4>Topics to Cover:</h4>
      <ul className="topics-list">
  {session.topics.map((topic, topicIndex) => (
    <li key={topicIndex}>
      <div className="topic-header">
      <input
  type="checkbox"
  id={`topic-${sessionIndex}-${topicIndex}`}
  checked={topic.completed}
  onChange={() => handleTopicChange(sessionIndex, topicIndex)}
/>


        <label>{topic.name}</label>
        <button
          onClick={() => handleTopicExpand(topicIndex)}
          className="view-lp-button"
        >
          {expandedTopic === topicIndex ? 'HIDE LP' : 'VIEW LP'}
        </button>
      </div>

      {expandedTopic === topicIndex && (
        <ul className="concepts-list">
          {topic.concepts.map((concept, conceptIndex) => (
            <li key={conceptIndex}>
              <div className="concept-header">
              <input
  type="checkbox"
  id={`concept-${sessionIndex}-${topicIndex}-${conceptIndex}`}
  checked={concept.completed}
  onChange={() => handleConceptChange(sessionIndex, topicIndex, conceptIndex)}
/>

                <label>{concept.name}</label>
              </div>
              <p>{concept.detailing || 'N/A'}</p>
              {concept.lessonPlans?.map((plan, planIndex) => (
                <pre key={planIndex}>{plan}</pre>
              ))}
            </li>
          ))}
        </ul>
      )}
    </li>
  ))}
</ul>

    </div>
  ))
) : (
  <p>No session details available.</p>
)}
    </div>

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
    <div className="observations-section">
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
    </div>

    <div className="end-session">
      <button onClick={handleEndSession} className="end-session-button">
        End Session
      </button>
    </div>
  </div>
  
  );
};  

export default SessionDetails;
