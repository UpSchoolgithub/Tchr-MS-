import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams, useLocation } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { teacherId, sessionId } = useParams();
  const location = useLocation();
  const { classId, subject, school, sectionName, sectionId, subjectId } = location.state || {};

  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [sessionDetails, setSessionDetails] = useState({});
  const [sessionList, setSessionList] = useState([]); // State for list of sessions
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [topics, setTopics] = useState([]);

  // Fetch students based on sectionId, school, and classId
  useEffect(() => {
    if (!sectionId) {
      console.error("sectionId is undefined. Cannot fetch students.");
      return;
    }

    const fetchStudents = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${school}/classes/${classId}/sections/${sectionId}/students`);
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [school, classId, sectionId]);

  // Fetch sessions based on sectionId and subjectId
  useEffect(() => {
    if (!sectionId || !subjectId) {
      console.error("sectionId or subjectId is undefined. Cannot fetch sessions.");
      return;
    }

    const fetchSessions = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${school}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions`);
        setSessionList(response.data); // Set session list for display
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, [school, classId, sectionId, subjectId]);

  // Fetch session details for a specific session
  useEffect(() => {
    if (!sessionId || !teacherId) {
      console.error("sessionId or teacherId is undefined. Cannot fetch session details.");
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        const response = await axiosInstance.get(`/teachers/${teacherId}/sessions/${sessionId}`);
        setSessionDetails(response.data);
        setTopics(response.data.topics || []);
      } catch (error) {
        console.error('Error fetching session details:', error);
      }
    };

    fetchSessionDetails();
  }, [sessionId, teacherId]);

  return (
    <div className="session-details-container">
      <h2>Session Details</h2>

      <div className="session-info">
        <p><strong>Class ID:</strong> {classId}</p>
        <p><strong>Subject:</strong> {subject}</p>
        <p><strong>School:</strong> {school}</p>
        <p><strong>Section:</strong> {sectionName}</p>
        <p><strong>Section ID:</strong> {sectionId}</p>
        <p><strong>Session Number:</strong> {sessionDetails.sessionNumber || 'N/A'}</p>
        <p><strong>Chapter:</strong> {sessionDetails.chapter || 'N/A'}</p>
      </div>

      <div className="session-list">
        <h3>Session List</h3>
        <ul>
          {sessionList.map((session) => (
            <li key={session.id}>
              <strong>Session ID:</strong> {session.id} <br />
              <strong>Chapter Name:</strong> {session.chapterName} <br />
              <strong>Number of Sessions:</strong> {session.numberOfSessions} <br />
              <strong>Priority:</strong> {session.priorityNumber}
            </li>
          ))}
        </ul>
      </div>

      <div className="session-topics-section">
        <h3>Topics to Cover</h3>
        <ul>
          {topics.map((topic) => (
            <li key={topic.id}>
              <label>
                <input
                  type="checkbox"
                  checked={topic.completed}
                  onChange={() => toggleTopicCompletion(topic.id)}
                />
                {topic.topicName}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SessionDetails;
