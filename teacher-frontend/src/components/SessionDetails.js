import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useParams } from 'react-router-dom'; // Import useParams
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';

const SessionDetails = () => {
  const { schoolId, teacherId, classId, sectionId, sessionId } = useParams(); // Extract parameters from the route
  const [students, setStudents] = useState([]); // List of students
  const [absentees, setAbsentees] = useState([]); // Selected absentees
  const [assignments, setAssignments] = useState(false); // Assignment flag
  const [sessionDetails, setSessionDetails] = useState({});
  const [loading, setLoading] = useState(true); // Loading state
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState(null); // Error message
  const [chapterName, setChapterName] = useState('');
  const [topics, setTopics] = useState([]);
  
  
  
  // Fetch students from the backend
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        console.log('Fetching students for teacherId:', teacherId, 'sectionId:', sectionId);
        const response = await axiosInstance.get(
          `/teachers/${teacherId}/sections/${sectionId}/students`
        );
        console.log('Student response:', response.data);
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
      console.error('Section ID is missing.');
      setError('Section ID is missing.');
    }
  }, [teacherId, sectionId]);
  

  useEffect(() => {
    const storedAbsentees = localStorage.getItem('absentees');
    if (storedAbsentees) {
      setAbsentees(JSON.parse(storedAbsentees));
    }
  }, []); // Run only once on component mount
  
  const handleAbsenteeChange = (selectedOptions) => {
    const selectedIds = selectedOptions?.map((option) => option.value) || [];
    setAbsentees(selectedIds);
    // Save to local storage
    localStorage.setItem('absentees', JSON.stringify(selectedIds));
  };

  // Handle assignment dropdown change
  const handleAssignmentsChange = (e) => {
    setAssignments(e.target.value === 'yes');
  };

  // Convert students to options for the dropdown
  const studentOptions = students.map((student) => ({
    value: student.rollNumber,
    label: student.studentName,
  }));

  const handleSaveAttendance = async () => {
    const attendanceData = students.map((student) => ({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0], // Current date
      status: absentees.includes(student.rollNumber) ? 'A' : 'P',
    }));
  
    console.log('Saving attendance:', attendanceData); // Debugging log
  
    try {
      await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/attendance`,
        { attendanceData }
      );
      alert('Attendance saved successfully!');
      // Clear absentees from local storage
      localStorage.removeItem('absentees');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance');
    }
  };
  
  // Fetch session details along with session plan
useEffect(() => {
  const fetchSessionDetails = async () => {
    try {
      const response = await axiosInstance.get(`/teachers/${teacherId}/sessions/${sessionId}`);
      const sessionData = response.data;

      if (sessionData.sessionDetails) {
        setSessionDetails(sessionData.sessionDetails);
        setChapterName(sessionData.sessionDetails.chapterName); // Set chapter name
      }

      if (sessionData.sessionPlans && sessionData.sessionPlans.length > 0) {
        const topics = sessionData.sessionPlans[0].planDetails || []; // Extract topics
        setTopics(topics); // Set topics to be covered in the session
      }
    } catch (error) {
      console.error('Error fetching session details and session plans:', error);
      setError('Failed to fetch session details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  fetchSessionDetails();
}, [teacherId, sessionId]);

  
  return (
    <div className="session-details-container">
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

          {/* Display absentees list only if absentees are selected */}
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

          {/* Right Side: Session Notes and Details */}
          <div className="session-notes-section">
          <h3>Session Notes and Details:</h3>
          {loading  ? (
            <p>Loading session details...</p>
          ) : (
            <>
              <p>
                <strong>Session Number:</strong> {sessionDetails.sessionNumber || 'N/A'}
              </p>
              <p>
                <strong>Chapter:</strong> {chapterName || 'N/A'}
              </p>

              <h4>Topics to Cover:</h4>
              {errorSessionDetails ? (
                <p className="error-message">{errorSessionDetails}</p>
              ) : topics.length > 0 ? (
                <ul>
                  {topics.map((topic, index) => (
                    <li key={index}>
                      <input
                        type="checkbox"
                        id={`topic-${index}`}
                        name={`topic-${index}`}
                        defaultChecked={false} // Default unchecked
                      />
                      <label htmlFor={`topic-${index}`}>{topic}</label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No topics available for this session.</p>
              )}

              <h4>Assignments:</h4>
              <select onChange={handleAssignmentsChange} defaultValue="no">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>

              {assignments && (
                <div className="assignment-input">
                  <label htmlFor="assignment-details">Enter Assignment Details:</label>
                  <textarea id="assignment-details" placeholder="Provide assignment details here..."></textarea>
                </div>
              )}

              <h4>Observations:</h4>
              <textarea
                className="observations-textarea"
                placeholder="Add observations or notes here..."
              ></textarea>

              <button className="end-session-button">End Session</button>
              </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
