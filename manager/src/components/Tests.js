import React from 'react';
import './Table.css'; // Ensure this path is correct

const Tests = ({ students }) => {
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const month = 'July';
  const year = 2024;

  return (
    <div className="table-container">
      <h3>Tests</h3>
      <table className="table">
        <thead>
          <tr>
            <th className="sticky month-header" colSpan="2"></th>
            <th className="month-header" colSpan={daysInMonth.length}>{`${month} ${year}`}</th>
            <th className="sticky total-header">Total</th>
          </tr>
          <tr>
            <th className="sticky">Roll Number</th>
            <th className="sticky">Student Name</th>
            {daysInMonth.map(day => (
              <th key={day}>{day}</th>
            ))}
            <th className="sticky total-header">P</th>
            <th className="sticky total-header">A</th>
            <th className="sticky total-header">T</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={index}>
              <td className="sticky">{student['Roll Number']}</td>
              <td className="sticky">{student['Student Name']}</td>
              {daysInMonth.map(day => (
                <td key={day}></td>
              ))}
              <td className="total-cell">0</td>
              <td className="total-cell">0</td>
              <td className="total-cell">0</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tests;
