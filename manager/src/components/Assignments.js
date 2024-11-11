// src/components/Assignments.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import './Assignments.css';

const Assignments = ({ schoolId, classId, sectionId }) => {
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/assignments`);
      const { students: fetchedStudents, assignmentRecords } = response.data;

      const formattedStudents = fetchedStudents.map(student => ({
        rollNumber: student.rollNumber,
        name: student.studentName
      }));
      setStudents(formattedStudents);

      const assignmentData = {};
      assignmentRecords.forEach(record => {
        const assignmentId = record.assignmentId;
        const studentId = record.studentId;
        if (!assignmentData[studentId]) assignmentData[studentId] = {};
        assignmentData[studentId][assignmentId] = record.status;
      });
      setAssignments(assignmentData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  return (
    <div className="assignments-management">
      <h3>Assignments</h3>
      <table className="assignments-table">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Name</th>
            <th>Assignment 1</th>
            <th>Assignment 2</th>
            <th>Assignment 3</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.rollNumber}>
              <td>{student.rollNumber}</td>
              <td>{student.name}</td>
              {[1, 2, 3].map(id => (
                <td key={id}>{assignments[student.rollNumber]?.[id] || '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Assignments;
