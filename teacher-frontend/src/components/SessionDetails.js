import React, { useState } from 'react';
import Select from 'react-select';
import './SessionDetails.css';

const SessionDetails = () => {
  const [absentees, setAbsentees] = useState([]);
  const [assignments, setAssignments] = useState(false);

  const studentOptions = [
    { value: 1, label: 'Shilpa' },
    { value: 2, label: 'Anirudh' },
    { value: 3, label: 'Anagha' },
  ];

  const handleAbsenteeChange = (selectedOptions) => {
    const selectedIds = selectedOptions?.map(option => option.value) || [];
    setAbsentees(selectedIds);
  };

  const handleAssignmentsChange = (e) => {
    setAssignments(e.target.value === 'yes');
  };

  return (
    <div className="session-details-container">
      <h2>Welcome, Teacher Name!</h2>

      <div className="attendance-and-notes">
        {/* Left Side: Mark Attendance */}
        <div className="attendance-section">
          <h3>Mark Attendance</h3>
          <Select
            isMulti
            options={studentOptions}
            onChange={handleAbsenteeChange}
            placeholder="Choose Absentees"
            value={studentOptions.filter(option => absentees.includes(option.value))}
            className="multi-select-dropdown"
            closeMenuOnSelect={false}
            isClearable
          />

          <div className="absentees-list">
            <h4>List of Absentees:</h4>
            <ul>
              {studentOptions.map(student => (
                <li key={student.value}>
                  {student.label}{' '}
                  {absentees.includes(student.value) ? (
                    <span style={{ color: 'red' }}>Absent</span>
                  ) : (
                    <span style={{ color: 'green' }}>Mark Present</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side: Session Notes and Details */}
        <div className="session-notes-section">
          <h3>Session Notes and Details:</h3>
          <p><strong>Session Number:</strong> 05</p>
          <p><strong>Chapter:</strong> Respiration in Plants</p>

          <h4>Topics to Cover:</h4>
          <ul>
            <li><input type="checkbox" /> Topic 1</li>
            <li><input type="checkbox" /> Topic 2</li>
            <li><input type="checkbox" /> Topic 3</li>
          </ul>

          <h4>Assignments:</h4>
          <select onChange={handleAssignmentsChange} defaultValue="no">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>

          {assignments && (
            <div className="assignment-input">
              <label htmlFor="assignment-details">Enter Assignment Details:</label>
              <textarea id="assignment-details" placeholder="Provide assignment details here..."></textarea>
            </div>
          )}

          <h4>Observations:</h4>
          <textarea className="observations-textarea" placeholder="Add observations or notes here..."></textarea>

          <button className="end-session-button">End Session</button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
