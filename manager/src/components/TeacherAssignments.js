import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './TeacherAssignments.css';

const TeacherAssignments = () => {
  const { teacherId } = useParams();
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axiosInstance.get(`/teachers/${teacherId}/assignments`);
        setAssignments(response.data);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }
    };

    fetchAssignments();
  }, [teacherId]);

  return (
    <div className="teacher-assignments">
      <h2>Assignments for Teacher</h2>
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
    </div>
  );
};

export default TeacherAssignments;
