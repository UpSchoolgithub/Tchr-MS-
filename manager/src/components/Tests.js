// src/components/Test.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';

const Test = ({ schoolId, classId, sectionId }) => {
  const [students, setStudents] = useState([]);
  const [testResults, setTestResults] = useState({});
  const [numTests, setNumTests] = useState(3); // Number of test columns

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
    <div className="test-management">
      <h3>Test Results</h3>

      <table className="test-table">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Name</th>
            {[...Array(numTests)].map((_, index) => (
              <th key={index}>Test {index + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.rollNumber}>
              <td>{student.rollNumber}</td>
              <td>{student.name}</td>
              {[...Array(numTests)].map((_, index) => (
                <td key={index}>-</td> // Display placeholder "-"
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Test;
