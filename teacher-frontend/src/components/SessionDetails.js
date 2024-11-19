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
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [error, setError] = useState(null);

  // Fetch students based on sectionId, school, and classId
  useEffect(() => {
    if (!sectionId) {
      console.error("Section ID is undefined. Cannot fetch students.");
      setError("Section ID is missing, cannot fetch students.");
      return;
    }

    const fetchStudents = async () => {
      try {
        const response = await axiosInstance.get(
          `/schools/${school}/classes/${classId}/sections/${sectionId}/students`
        );
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to load students.');
      }
    };

    fetchStudents();
  }, [school, classId, sectionId]);

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
      console.error("Error saving attendance:", error);
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
      console.error("Error finalizing attendance:", error);
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
        <p><strong>Session Plan ID:</strong> {sessionPlanId || "N/A"}</p>
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
