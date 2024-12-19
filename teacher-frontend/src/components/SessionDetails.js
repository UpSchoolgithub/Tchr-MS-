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
  const [sessionDetails, setSessionDetails] = useState([]);
  const [observations, setObservations] = useState('');
  const [completedTopics, setCompletedTopics] = useState([]);

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

        const transformedSessions = response.data.sessions.map((session) => ({
          ...session,
          topics: session.topics.map((topic) => ({
            name: topic.name,
            concepts: topic.concepts.map((concept) => ({
              concept: concept.concept,
              detailing: concept.detailing,
              lessonPlan: concept.lessonPlan,
            })),
          })),
        }));

        setSessionDetails(transformedSessions);
      } catch (error) {
        setError('Failed to fetch session details. Please try again.');
      }
    };

    if (teacherId && sectionId && subjectId) fetchSessionDetails();
  }, [teacherId, sectionId, subjectId]);

  // Track completed topics
  const handleTopicChange = (topicName) => {
    setCompletedTopics((prev) => {
      if (prev.includes(topicName)) {
        return prev.filter((name) => name !== topicName);
      } else {
        return [...prev, topicName];
      }
    });
  };

  const handleAbsenteeChange = (selectedOptions) => {
    const selectedIds = selectedOptions?.map((option) => option.value) || [];
    setAbsentees(selectedIds);
  };

  const handleSaveAttendance = async () => {
    const attendanceData = students.map((student) => ({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      status: absentees.includes(student.id) ? 'A' : 'P',
    }));

    try {
      await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/attendance`,
        { attendanceData }
      );
      alert('Attendance saved successfully!');
    } catch (error) {
      alert('Failed to save attendance. Please try again.');
    }
  };

  const handleSaveObservations = async () => {
    try {
      await axiosInstance.post('/api/observations', {
        sessionPlanId: sessionDetails?.sessionPlanId,
        observations,
      });
      alert('Observations saved successfully!');
    } catch (error) {
      alert('Failed to save observations.');
    }
  };

  const handleEndSession = async () => {
    if (!sessionDetails || sessionDetails.length === 0) {
      alert('No session details available to end the session.');
      return;
    }

    const completedTopicsPayload = sessionDetails.flatMap((session) =>
      session.topics.filter((topic) => completedTopics.includes(topic.name))
    );

    try {
      const payload = {
        sessionPlanId: sessionDetails[0].sessionPlanId,
        completedTopics: completedTopicsPayload,
        observations,
        absentees,
      };

      await axiosInstance.post(
        `/teachers/${teacherId}/sessions/${sessionDetails[0].sessionId}/end`,
        payload
      );

      alert('Session ended successfully!');
      navigate(`/teacher-sessions/${teacherId}`);
    } catch (error) {
      alert('Failed to end the session. Please try again.');
    }
  };

  const studentOptions = students.map((student) => ({
    value: student.id,
    label: `${student.studentName} (${student.rollNumber})`,
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

      <h2>Welcome, Teacher!</h2>

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
        {sessionDetails.length > 0 ? (
          sessionDetails.map((session, sessionIdx) => (
            <div key={sessionIdx} className="session-item">
              <p><strong>Session ID:</strong> {session.sessionId}</p>
              <p><strong>Chapter Name:</strong> {session.chapterName}</p>
              <ul className="topics-list">
                {session.topics.map((topic, topicIdx) => (
                  <li key={topicIdx} className="topic-item">
                    <input
                      type="checkbox"
                      id={`topic-${sessionIdx}-${topicIdx}`}
                      checked={completedTopics.includes(topic.name)}
                      onChange={() => handleTopicChange(topic.name)}
                    />
                    <label htmlFor={`topic-${sessionIdx}-${topicIdx}`}>{topic.name}</label>
                    <ul className="concepts-list">
                      {topic.concepts.map((concept, conceptIdx) => (
                        <li key={conceptIdx} className="concept-item">
                          <p><strong>Concept:</strong> {concept.concept}</p>
                          <p><strong>Detailing:</strong> {concept.detailing}</p>
                          {concept.lessonPlan && (
                            <pre><strong>Lesson Plan:</strong> {concept.lessonPlan}</pre>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p>No session details available.</p>
        )}
      </div>

      <div className="observations-section">
        <h4>Observations:</h4>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Add observations here..."
        />
        <button onClick={handleSaveObservations}>Save Observations</button>
      </div>

      <div className="end-session">
        <button onClick={handleEndSession}>End Session</button>
      </div>
    </div>
  );
};

export default SessionDetails;
