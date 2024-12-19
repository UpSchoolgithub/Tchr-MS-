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

  const [expandedTopic, setExpandedTopic] = useState(null);
  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [completedTopics, setCompletedTopics] = useState([]);
  const [observations, setObservations] = useState('');

  // Fetch session details
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/teachers/${teacherId}/sections/${sectionId}/subjects/${subjectId}/sessions`
        );
        console.log('Fetched session details:', response.data);
        setSessionDetails(response.data.sessions || []);
      } catch (error) {
        console.error('Error fetching session details:', error);
        setError('Failed to fetch session details.');
      }
    };

    if (teacherId && sectionId && subjectId) fetchSessionDetails();
  }, [teacherId, sectionId, subjectId]);

  // Handle topic checkbox change
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

  // Handle "Mark All as Completed"
  const handleMarkAllChange = (e) => {
    if (e.target.checked) {
      setCompletedTopics(sessionDetails.topics.map((topic) => topic.name));
    } else {
      setCompletedTopics([]);
    }
  };

  const handleEndSession = async () => {
    if (!sessionDetails) {
      alert('Session details are missing. Cannot end the session.');
      return;
    }

    if (completedTopics.length === 0) {
      alert('Please mark at least one topic as completed.');
      return;
    }

    try {
      const payload = {
        completedTopics,
        incompleteTopics: sessionDetails.topics
          .filter((topic) => !completedTopics.includes(topic.name))
          .map((topic) => topic.name),
        observations,
        absentees,
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

  return (
    <div className="session-details-container">
      <h2>Session Details</h2>

      {error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          <div className="session-info">
            <p><strong>School ID:</strong> {schoolId || 'Not Available'}</p>
            <p><strong>Class ID:</strong> {classId || 'Not Available'}</p>
            <p><strong>Section ID:</strong> {sectionId || 'Not Available'}</p>
            <p><strong>Subject ID:</strong> {subjectId || 'Not Available'}</p>
          </div>

          {sessionDetails ? (
            <div className="topics-container">
              <h4>Topics to Cover:</h4>
              <div className="mark-all-container">
                <input
                  type="checkbox"
                  id="mark-all"
                  checked={allTopicsCompleted}
                  onChange={handleMarkAllChange}
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
                        {expandedTopic === idx ? 'HIDE LP' : 'VIEW LP'}
                      </button>
                    </div>
                    {expandedTopic === idx && (
                      <div className="lesson-plan-container">
                        <h5>Concept: {topic.concept}</h5>
                        <p>Detailing: {topic.detailing}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <button className="end-session-button" onClick={handleEndSession}>
                End Session
              </button>
            </div>
          ) : (
            <p>No session details available.</p>
          )}
        </>
      )}
    </div>
  );
};

export default SessionDetails;
