// src/components/Tests.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import './Tests.css';

const Tests = ({ schoolId, classId, sectionId }) => {
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState({});

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/tests`);
      const { students: fetchedStudents, testRecords } = response.data;

      const formattedStudents = fetchedStudents.map(student => ({
        rollNumber: student.rollNumber,
        name: student.studentName
      }));
      setStudents(formattedStudents);

      const testData = {};
      testRecords.forEach(record => {
        const testId = record.testId;
        const studentId = record.studentId;
        if (!testData[studentId]) testData[studentId] = {};
        testData[studentId][testId] = record.status;
      });
      setTests(testData);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  return (
    <div className="tests-management">
      <h3>Tests</h3>
      <table className="tests-table">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Name</th>
            <th>Test 1</th>
            <th>Test 2</th>
            <th>Test 3</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.rollNumber}>
              <td>{student.rollNumber}</td>
              <td>{student.name}</td>
              {[1, 2, 3].map(id => (
                <td key={id}>{tests[student.rollNumber]?.[id] || '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tests;
