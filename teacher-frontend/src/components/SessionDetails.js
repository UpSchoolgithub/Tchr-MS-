import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axiosInstance from '../services/axiosInstance';
import { useParams, useLocation } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { teacherId, sessionId } = useParams();
  const location = useLocation();
  const { classId, subject, school, sectionName, sectionId, sessionPlanId } = location.state || {};

  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [sessionDetails, setSessionDetails] = useState({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [sessionPlanDetails, setSessionPlanDetails] = useState({});
  const [error, setError] = useState(null);  // Define error state

  // Fetch students based on sectionId, school, and classId
  useEffect(() => {
    if (!sectionId) {
      console.error("sectionId is undefined. Cannot fetch students.");
      setError("Section ID is missing, cannot fetch students.");
      return;
    }

    const fetchStudents = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${school}/classes/${classId}/sections/${sectionId}/students`);
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to load students.');
      }
    };

    fetchStudents();
  }, [school, classId, sectionId]);

  // Fetch session details and associated session plan details
  useEffect(() => {
    if (!sessionId || !teacherId || !sessionPlanId) {
      console.error("Session ID, Teacher ID, or Session Plan ID is undefined. Cannot fetch session details.");
      setError('Session or Teacher ID or Session Plan ID missing.');
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        // Fetch session details based on sessionId and teacherId
        const sessionResponse = await axiosInstance.get(`/teachers/${teacherId}/sessions/${sessionId}`);
        setSessionDetails(sessionResponse.data.sessionDetails);

        // Fetch session plan details if sessionPlanId is provided
        const sessionPlanResponse = await axiosInstance.get(`/schools/${school}/classes/${classId}/sections/${sectionId}/subjects/${subject}/sessionplans/${sessionPlanId}`);
        setSessionPlanDetails(sessionPlanResponse.data);
      } catch (error) {
        console.error('Error fetching session details or session plan:', error);
        setError('Failed to load session details or session plan.');
      }
    };

    fetchSessionDetails();
  }, [sessionId, teacherId, school, classId, sectionId, subject, sessionPlanId]);

  // Handle changes to the absentee selection
  const handleAbsenteeChange = (selectedOptions) => {
    const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setAbsentees(selectedIds);
  };

  // Save attendance data to the backend
  const saveAttendance = async () => {
    const attendanceData = students.map(student => ({
      studentId: student.id,
      sectionId,
      date: new Date().toISOString().split('T')[0],
      status: absentees.includes(student.id) ? 'A' : 'P',
    }));

    try {
      await axiosInstance.post(`/schools/${school}/classes/${classId}/sections/${sectionId}/attendance`, { attendanceData });
      setAttendanceSaved(true);
      alert("Attendance saved successfully. You can still edit until the session is ended.");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance.");
    }
  };

  // End the session and finalize attendance
  const endSession = async () => {
    if (!attendanceSaved) {
      alert("Please save the attendance before ending the session.");
      return;
    }

    try {
      await axiosInstance.post(`/teachers/${teacherId}/sessions/${sessionId}/finalize-attendance`, {
        sessionId,
        finalized: true,
      });
      alert("Session ended and attendance finalized.");
    } catch (error) {
      console.error("Error finalizing attendance:", error);
      alert("Failed to finalize attendance.");
    }
  };

  // Convert students into options for react-select
  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.studentName,
  }));

  if (error) return <p>{error}</p>;

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
        <p><strong>Session Plan ID:</strong> {sessionPlanId || 'N/A'}</p>
        <p><strong>Session Plan Details:</strong> {sessionPlanDetails.planDetails || 'N/A'}</p>
      </div>

      <div className="attendance-section">
        <h3>Mark Attendance</h3>
        <Select
          isMulti
          options={studentOptions}
          onChange={handleAbsenteeChange}
          placeholder="Select absentees"
          value={studentOptions.filter(option => absentees.includes(option.value))}
          className="multi-select-dropdown"
          closeMenuOnSelect={false}
          isClearable
        />

        <div className="absentees-list">
          <h4>List of Absentees:</h4>
          <div className="absentee-tags">
            {absentees.map(id => {
              const student = students.find(s => s.id === id);
              return (
                <div key={id} className="absentee-tag">
                  <span>{student?.studentName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="session-notes-section">
        <h3>Session Notes and Details</h3>
        <textarea className="observations-textarea" placeholder="Observations"></textarea>
        <button className="save-button" onClick={saveAttendance}>Save Attendance</button>
        <button className="end-session-button" onClick={endSession}>End Session</button>
      </div>
    </div>
  );
};

export default SessionDetails;
