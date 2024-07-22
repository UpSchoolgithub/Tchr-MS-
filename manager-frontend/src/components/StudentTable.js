import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../services/axiosInstance';
import './StudentTable.css';

const StudentTable = ({ schoolId, classId, sectionId }) => {
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('Personal Details');
  const [dateFilter, setDateFilter] = useState({ start: '2024-04-01', end: '2025-04-01' });
  const [currentMonthDates, setCurrentMonthDates] = useState([]);

  useEffect(() => {
    const getCurrentMonthDates = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const dates = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        dates.push(date.toLocaleDateString('en-GB')); // Format: DD/MM/YYYY
      }
      return dates;
    };

    setCurrentMonthDates(getCurrentMonthDates());
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.error('No file selected.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      const parsedStudents = jsonData.map((row, index) => ({
        id: index + 1,
        rollNumber: row['Roll Number'],
        studentName: row['Student Name'],
        studentEmail: row['Student Email'],
        studentPhone: row['Student Phone'],
        parentName: row['Parent Name'],
        parentPhone1: row['Parent Phone 1'],
        parentPhone2: row['Parent Phone 2 (optional)'],
        parentEmail: row['Parent Email'],
      }));

      setStudents(parsedStudents);

      // Send the data to the server to save in the database
      axiosInstance.post(`/api/students`, parsedStudents)
        .then(response => {
          console.log('Students saved successfully:', response.data);
        })
        .catch(error => {
          console.error('Error saving students:', error.response ? error.response.data : error.message);
        });
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prevFilter => ({ ...prevFilter, [name]: value }));
  };

  const renderTableContent = () => {
    return students.map((student) => (
      <tr key={student.id}>
        <td>{student.rollNumber}</td>
        <td>{student.studentName}</td>
        {activeTab === 'Personal Details' ? (
          <>
            <td>{student.studentEmail}</td>
            <td>{student.studentPhone}</td>
            <td>{student.parentName}</td>
            <td>{student.parentPhone1}</td>
            <td>{student.parentPhone2}</td>
            <td>{student.parentEmail}</td>
          </>
        ) : (
          currentMonthDates.map(date => (
            <td key={date} className="date-cell">{/* Add the data for the specific date and student here */}</td>
          ))
        )}
      </tr>
    ));
  };

  return (
    <div className="student-table-container">
      <h1>Upload Student File</h1>
      <input type="file" onChange={handleFileUpload} />
      <div className="tabs">
        <button onClick={() => setActiveTab('Personal Details')}>Personal Details</button>
        <button onClick={() => setActiveTab('Attendance')}>Attendance</button>
        <button onClick={() => setActiveTab('Test')}>Test</button>
        <button onClick={() => setActiveTab('Assignments')}>Assignments</button>
      </div>
      <div className="date-filter">
        <label>Filter by Date:</label>
        <input type="date" name="start" value={dateFilter.start} onChange={handleDateFilterChange} />
        <input type="date" name="end" value={dateFilter.end} onChange={handleDateFilterChange} />
      </div>
      <div className="table-container">
        <table className="student-table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              {activeTab === 'Personal Details' ? (
                <>
                  <th>Student Email</th>
                  <th>Student Phone</th>
                  <th>Parent Name</th>
                  <th>Parent Phone 1</th>
                  <th>Parent Phone 2</th>
                  <th>Parent Email</th>
                </>
              ) : (
                currentMonthDates.map(date => (
                  <th key={date} className="date-header">{date}</th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {renderTableContent()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;
