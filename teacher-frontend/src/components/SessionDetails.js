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
  const [loadingSessionDetails, setLoadingSessionDetails] = useState(true); // Add this line
  const [sessionError, setSessionError] = useState(null);
  const [academicStartDate, setAcademicStartDate] = useState(null);

  
  
  // Fetch students from the backend
  useEffect(() => {
    const fetchStudents = async () => {
      if (!sectionId) {
        setError('Section ID is missing.');
        return;
      }
      try {
        const response = await axiosInstance.get(
          `/teachers/${teacherId}/sections/${sectionId}/students`
        );
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchStudents();
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
          setSessionDetails({
            chapterName: sessionData.sessionDetails.chapterName,
            sessionNumber: sessionData.sessionDetails.sessionNumber,
          });
          setTopics(sessionData.sessionDetails.planDetails); // Topics from session plan
        } else {
          setSessionDetails({ chapterName: 'N/A', sessionNumber: 'N/A' });
        }
      } catch (error) {
        console.error('Error fetching session details:', error);
        setError('Failed to fetch session details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    if (sessionId && sessionId !== 'unknown') {
      fetchSessionDetails();
    }
  }, [teacherId, sessionId]);
  

  useEffect(() => {
    const fetchAcademicStartDate = async () => {
      try {
        const response = await axiosInstance.get(`/classes/${classId}/academic-start-date`);
        console.log('Academic Start Date:', response.data.academicStartDate);
      } catch (error) {
        console.error('Error fetching academic start date:', error);
      }
    };
  
    if (classId) fetchAcademicStartDate();
  }, [classId]);
  
  
  const calculateAcademicDay = () => {
    if (!academicStartDate) {
      console.error('Academic Start Date is missing.');
      return null;
    }
    const startDate = new Date(academicStartDate);
    const currentDate = new Date();
    const differenceInDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    return differenceInDays + 1; // Add 1 for the current day
  };
  
  
  const academicDay = calculateAcademicDay();
  

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/teachers/${teacherId}/sessions/${sessionId}`, 
          { params: { academicDay } } // Pass the academic day to the backend
        );
        const sessionData = response.data;
  
        if (sessionData.sessionDetails) {
          setSessionDetails(sessionData.sessionDetails);
          setChapterName(sessionData.sessionDetails.chapterName);
        }
  
        if (sessionData.sessionPlans && sessionData.sessionPlans.length > 0) {
          const topics = sessionData.sessionPlans[0].planDetails || [];
          setTopics(topics);
        }
      } catch (error) {
        console.error("Error fetching session details and session plans:", error);
        setError("Failed to fetch session details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    if (academicDay) fetchSessionDetails();
  }, [teacherId, sessionId, academicDay]);
  
  const handleTopicChange = (topic, isChecked) => {
    if (isChecked) {
      setIncompleteTopics((prev) => [...prev, topic]);
    } else {
      setIncompleteTopics((prev) => prev.filter((t) => t !== topic));
    }
  };
  

  const handleEndSession = async () => {
    try {
      await axiosInstance.post(`/teachers/${teacherId}/sessions/${sessionId}/end`, {
        incompleteTopics,
      });
      alert("Session ended successfully!");
    } catch (error) {
      console.error("Error ending session:", error);
      alert("Error ending session.");
    }
  };

  
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
          {/* Right Side: Session Notes and Details */}
          <div className="session-notes-section">
            <h3>Session Notes and Details:</h3>
            {loading ? (
              <p>Loading session details...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : (
              <>
                <p>
                  <strong>Session Number:</strong> {sessionDetails.sessionNumber ?? 'N/A'}
                </p>
                <p>
                  <strong>Chapter:</strong> {sessionDetails.chapterName ?? 'N/A'}
                </p>
                <h4>Topics to Cover:</h4>
                {topics.length > 0 ? (
                  <ul>
                    {topics.map((topic, index) => (
                      <li key={index}>
                        <input type="checkbox" id={`topic-${index}`} />
                        <label htmlFor={`topic-${index}`}>{topic}</label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No topics available for this session.</p>
                )}
              </>
            )}
          </div>
      </div>
    </div>
  );
};

export default SessionDetails;
