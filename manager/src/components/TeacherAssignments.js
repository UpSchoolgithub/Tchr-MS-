import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams } from 'react-router-dom';
import './TeacherAssignments.css';

const TeacherAssignments = () => {
  const { teacherId } = useParams(); // Ensure teacherId is retrieved from URL
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
        setAssignments(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setError('Failed to load assignments');
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [teacherId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="assignments-container">
      <h2>Assignments for Teacher</h2>
      {assignments.length === 0 ? (
        <p>No assignments found.</p>
      ) : (
        <table className="assignments-table">
          <thead>
            <tr>
              <th>School</th>
              <th>Day</th>
              <th>Period</th>
              <th>Subject</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment, index) => (
              <tr key={index}>
                <td>{assignment.schoolName}</td>
                <td>{assignment.day}</td>
                <td>{assignment.period}</td>
                <td>{assignment.subjectName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TeacherAssignments;
