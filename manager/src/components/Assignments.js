// src/components/Assignments.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';

const Assignments = ({ schoolId, classId, sectionId }) => {
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [numAssignments, setNumAssignments] = useState(3); // Number of assignment columns

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`);
      const formattedStudents = response.data.map(student => ({
        rollNumber: student.rollNumber,
        name: student.studentName
      }));
      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
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
            {[...Array(numAssignments)].map((_, index) => (
              <th key={index}>Assignment {index + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.rollNumber}>
              <td>{student.rollNumber}</td>
              <td>{student.name}</td>
              {[...Array(numAssignments)].map((_, index) => (
                <td key={index}>-</td> // Display placeholder "-"
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Assignments;
