import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';

const SessionDetails = () => {
  const { schoolId, teacherId, classId, sectionId, sessionId } = useParams();
  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [assignments, setAssignments] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chapterName, setChapterName] = useState('');
  const [topics, setTopics] = useState([]);
  const [observations, setObservations] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axiosInstance.get(`/teachers/${teacherId}/sections/${sectionId}/students`);
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

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`);
        setChapterName(response.data.chapterName || 'Unknown Chapter');
        setTopics(response.data.topics || []);
      } catch (error) {
        console.error('Error fetching session details:', error);
        setError('Failed to load session details. Please try again.');
      }
    };

    if (sessionId) {
      fetchSessionDetails();
    }
  }, [schoolId, classId, sectionId, sessionId]);

  useEffect(() => {
    const storedAbsentees = localStorage.getItem('absentees');
    if (storedAbsentees) {
      setAbsentees(JSON.parse(storedAbsentees));
    }
  }, []);

  const handleAbsenteeChange = (selectedOptions) => {
    const selectedIds = selectedOptions?.map((option) => option.value) || [];
    setAbsentees(selectedIds);
    localStorage.setItem('absentees', JSON.stringify(selectedIds));
  };

  const handleAssignmentsChange = (e) => {
    setAssignments(e.target.value === 'yes');
  };

  const handleEndSession = async () => {
    const completedTopics = topics.filter((topic) => topic.completed).map((topic) => topic.name);
    try {
      await axiosInstance.post(
        `/teachers/${teacherId}/sections/${sectionId}/sessions/${sessionId}/end`,
        {
          completedTopics,
          observations,
          assignmentDetails: assignments ? assignmentDetails : '',
        }
      );
      alert('Session ended successfully!');
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session. Please try again.');
    }
  };

  const handleTopicToggle = (index) => {
    setTopics((prevTopics) =>
      prevTopics.map((topic, i) =>
        i === index ? { ...topic, completed: !topic.completed } : topic
      )
    );
  };

  const studentOptions = students.map((student) => ({
    value: student.rollNumber,
    label: student.studentName,
  }));

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
      localStorage.removeItem('absentees');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance');
    }
  };

  return (
    <div className="session-details-container">
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
              <button onClick={handleSaveAttendance} className="save-attendance-button">
                Save Attendance
              </button>
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
            </>
          )}

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

        <div className="session-notes-section">
          <h3>Session Notes and Details:</h3>
          <p>
            <strong>Chapter:</strong> {chapterName}
          </p>

          <h4>Topics to Cover:</h4>
          <ul>
            {topics.length > 0 ? (
              topics.map((topic, index) => (
                <li key={index}>
                  <input
                    type="checkbox"
                    checked={topic.completed || false}
                    onChange={() => handleTopicToggle(index)}
                  />
                  {topic.name}
                </li>
              ))
            ) : (
              <p>No topics available for this session.</p>
            )}
          </ul>

          <h4>Assignments:</h4>
          <select onChange={handleAssignmentsChange} defaultValue="no">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>

          {assignments && (
            <div className="assignment-input">
              <label htmlFor="assignment-details">Enter Assignment Details:</label>
              <textarea
                id="assignment-details"
                value={assignmentDetails}
                onChange={(e) => setAssignmentDetails(e.target.value)}
                placeholder="Provide assignment details here..."
              ></textarea>
            </div>
          )}

          <h4>Observations:</h4>
          <textarea
            className="observations-textarea"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Add observations or notes here..."
          ></textarea>

          <button onClick={handleEndSession} className="end-session-button">
            End Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
