import React from 'react';
import './Table.css'; // Ensure this path is correct

const PersonalDetails = ({ students }) => {
  return (
    <div>
      <h3>Personal Details</h3>
      {students.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Student Email</th>
              <th>Student Phone Number</th>
              <th>Parent Name</th>
              <th>Parent Phone Number</th>
              <th>Parent Phone Number 2 (optional)</th>
              <th>Parent Email</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={index}>
                <td>{student['Roll Number']}</td>
                <td>{student['Student Name']}</td>
                <td>{student['Student Email']}</td>
                <td>{student['Student Phone Number']}</td>
                <td>{student['Parent Name']}</td>
                <td>{student['Parent Phone Number']}</td>
                <td>{student['Parent Phone Number 2 (optional)']}</td>
                <td>{student['Parent Email']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No students uploaded yet.</p>
      )}
    </div>
  );
};

export default PersonalDetails;
