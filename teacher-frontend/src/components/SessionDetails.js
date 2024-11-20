import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { sessionId } = useParams();
  const [sessionDetails, setSessionDetails] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const response = await axiosInstance.get(`/sessions/${sessionId}`);
        const sessionData = response.data;

        if (sessionData) {
          setSessionDetails({
            schoolName: sessionData.schoolName,
            className: sessionData.className,
            sectionName: sessionData.sectionName,
            subjectName: sessionData.subjectName,
            day: sessionData.day,
            period: sessionData.period,
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
            assignments: sessionData.assignments,
            chapterName: sessionData.chapterName, // Include chapterName
          });
        }
      } catch (error) {
        console.error('Error fetching session details:', error);
        setError('Failed to fetch session details.');
      }
    };

    const fetchAttendance = async () => {
      try {
        const attendanceResponse = await axiosInstance.get(`/sessions/${sessionId}/attendance`);
        setAttendance(attendanceResponse.data);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setError('Failed to fetch attendance data.');
      }
    };

    fetchSessionDetails();
    fetchAttendance();
  }, [sessionId]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prevAttendance) =>
      prevAttendance.map((record) =>
        record.studentId === studentId ? { ...record, status } : record
      )
    );
  };

  const saveAttendance = async () => {
    try {
      await axiosInstance.put(`/sessions/${sessionId}/attendance`, attendance);
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance.');
    }
  };

  return (
    <div className="session-details-container">
      <h2>Session Notes and Details</h2>
      {error && <p className="error-message">{error}</p>}
      {!error && (
        <div>
          <div className="session-info">
            <p><strong>Session Number:</strong> {sessionId}</p>
            <p><strong>Chapter:</strong> {sessionDetails.chapterName}</p> {/* Display chapter name */}
            <p><strong>School:</strong> {sessionDetails.schoolName}</p>
            <p><strong>Class:</strong> {sessionDetails.className}</p>
            <p><strong>Section:</strong> {sessionDetails.sectionName}</p>
            <p><strong>Subject:</strong> {sessionDetails.subjectName}</p>
            <p><strong>Day:</strong> {sessionDetails.day}</p>
            <p><strong>Period:</strong> {sessionDetails.period}</p>
            <p><strong>Start Time:</strong> {sessionDetails.startTime}</p>
            <p><strong>End Time:</strong> {sessionDetails.endTime}</p>
            <p><strong>Assignments:</strong> {sessionDetails.assignments}</p>
          </div>

          <h3>Attendance</h3>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record.studentId}>
                  <td>{record.rollNumber}</td>
                  <td>{record.studentName}</td>
                  <td>
                    <select
                      value={record.status}
                      onChange={(e) => handleAttendanceChange(record.studentId, e.target.value)}
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={saveAttendance}>Save Attendance</button>
        </div>
      )}
    </div>
  );
};

export default SessionDetails;
