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
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!sectionId) {
        setError("Section ID is missing, cannot fetch students.");
        return;
      }

      try {
        const response = await axiosInstance.get(
          `/schools/${school}/classes/${classId}/sections/${sectionId}/students`
        );
        setStudents(response.data);
      } catch (error) {
        setError("Failed to load students.");
      }
    };

    const fetchSessionDetails = async () => {
      if (!sessionId || !teacherId) {
        setError("Session ID or Teacher ID is missing.");
        return;
      }

      try {
        const sessionResponse = await axiosInstance.get(
          `/teachers/${teacherId}/sessions/${sessionId}`
        );
        setSessionDetails(sessionResponse.data.sessionDetails || {});

        if (sessionPlanId) {
          const sessionPlanResponse = await axiosInstance.get(
            `/schools/${school}/classes/${classId}/sections/${sectionId}/subjects/${subject}/sessionplans/${sessionPlanId}`
          );
          setSessionPlanDetails(sessionPlanResponse.data || {});
        }
      } catch (error) {
        setError("Failed to load session details or session plan.");
      }
    };

    fetchStudents();
    fetchSessionDetails();
  }, [school, classId, sectionId, sessionId, teacherId, subject, sessionPlanId]);

  const handleAbsenteeChange = (selectedOptions) => {
    const selectedIds = selectedOptions?.map(option => option.value) || [];
    setAbsentees(selectedIds);
  };

  const saveAttendance = async () => {
    const attendanceData = students.map(student => ({
      studentId: student.id,
      sectionId,
      date: new Date().toISOString().split('T')[0],
      status: absentees.includes(student.id) ? 'A' : 'P',
    }));

    try {
      await axiosInstance.post(
        `/schools/${school}/classes/${classId}/sections/${sectionId}/attendance`,
        { attendanceData }
      );
      setAttendanceSaved(true);
      alert("Attendance saved successfully. You can still edit until the session is ended.");
    } catch (error) {
      alert("Failed to save attendance.");
    }
  };

  const endSession = async () => {
    if (!attendanceSaved) {
      alert("Please save the attendance before ending the session.");
      return;
    }

    try {
      await axiosInstance.post(
        `/teachers/${teacherId}/sessions/${sessionId}/finalize-attendance`,
        { sessionId, finalized: true }
      );
      alert("Session ended and attendance finalized.");
    } catch (error) {
      alert("Failed to finalize attendance.");
    }
  };

  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.studentName,
  }));

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="session-details-container">
      <h2>Session Details</h2>

      <div className="session-info">
        <p><strong>Class ID:</strong> {classId || "N/A"}</p>
        <p><strong>Subject:</strong> {subject || "N/A"}</p>
        <p><strong>School:</strong> {school || "N/A"}</p>
        <p><strong>Section:</strong> {sectionName || "N/A"}</p>
        <p><strong>Section ID:</strong> {sectionId || "N/A"}</p>
        <p><strong>Session Number:</strong> {sessionDetails.sessionNumber || "N/A"}</p>
        <p><strong>Chapter:</strong> {sessionDetails.chapter || "N/A"}</p>
        <p><strong>Session Plan Details:</strong> {sessionPlanDetails.planDetails || "N/A"}</p>
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
          {absentees.map(id => {
            const student = students.find(s => s.id === id);
            return <div key={id} className="absentee-tag">{student?.studentName || "Unknown"}</div>;
          })}
        </div>
      </div>

      <div className="session-actions">
        <textarea
          className="observations-textarea"
          placeholder="Add observations or notes here..."
        />
        <button className="save-button" onClick={saveAttendance}>Save Attendance</button>
        <button className="end-session-button" onClick={endSession}>End Session</button>
      </div>
    </div>
  );
};

export default SessionDetails;
