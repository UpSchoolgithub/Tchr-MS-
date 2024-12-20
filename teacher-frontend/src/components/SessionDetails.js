import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';

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
    const fetchTodaySessionDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/teachers/${teacherId}/sections/${sectionId}/subjects/${subjectId}/sessions/today`
        );
  
        const session = response.data.sessionDetails.map((s) => ({
          ...s,
          topics: s.topics.map((topic) => ({
            ...topic,
            completed: false,
            concepts: topic.details.map((detail) => ({
              name: detail.concept,
              detailing: detail.conceptDetailing,
              lessonPlans: detail.lessonPlans.map((plan) => {
                const objectivesIndex = plan.indexOf('Objectives');
                return objectivesIndex !== -1
                  ? plan.substring(objectivesIndex)
                  : plan;
              }),
              completed: false,
            })),
          })),
        }));
  
        setSessionDetails(session);
      } catch (err) {
        setError('Failed to fetch session details for today.');
        console.error(err);
      }
    };
  
    if (teacherId && sectionId && subjectId) fetchTodaySessionDetails();
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

  const handleConceptChange = (topicIndex, conceptIndex) => {
    setSessionDetails((prevDetails) => {
      const updatedDetails = [...prevDetails];
      const topic = updatedDetails[0]?.topics[topicIndex];
      const concept = topic.concepts[conceptIndex];

      concept.completed = !concept.completed;
      topic.completed = topic.concepts.every((c) => c.completed);

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
    if (!sessionDetails || !sessionDetails.sessionPlanId) {
      alert('Session Plan ID is missing. Cannot end the session.');
      return;
    }

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

    <div className="session-notes-section">
      <h3>Session Notes and Details:</h3>
      {sessionDetails?.length > 0 ? (
  sessionDetails.map((session, sessionIndex) => (
    <div key={sessionIndex} className="session-item">
      <p><strong>Session ID:</strong> {session.sessionId || 'N/A'}</p>
      <p><strong>Chapter Name:</strong> {session.chapterName || 'N/A'}</p>
      <h4>Topics to Cover:</h4>
      <ul className="topics-list">
        {session.topics.map((topic, topicIndex) => (
          <li key={topicIndex}>
            <div className="topic-header">
              <input
                type="checkbox"
                id={`topic-${sessionIndex}-${topicIndex}`}
                checked={topic.completed}
                onChange={() => handleTopicChange(topic.name)}
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
                    <input
                      type="checkbox"
                      checked={concept.completed}
                      onChange={() =>
                        handleConceptChange(topicIndex, conceptIndex)
                      }
                    />
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
  <p>No session details available for today.</p>
)}

</div>


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
