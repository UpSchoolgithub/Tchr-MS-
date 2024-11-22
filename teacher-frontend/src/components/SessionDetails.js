import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';

const SessionDetails = () => {
  const { schoolId, teacherId, classId, sectionId } = useParams();
  console.log({ schoolId, teacherId, classId, sectionId });

  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch students from the backend
  useEffect(() => {
    const fetchStudents = async () => {
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

    if (sectionId) {
      fetchStudents();
    } else {
      setError('Section ID is missing.');
    }
  }, [teacherId, sectionId]);

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
      </div>
    </div>
  );
};

export default SessionDetails;
