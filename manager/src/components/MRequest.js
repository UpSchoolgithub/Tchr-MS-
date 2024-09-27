import React from 'react';
import './MRequest.css';

const MRequest = () => {
  return (
    <div className="request-container">
      <h2>Request</h2>
      <p>Manage requests from teachers and students here.</p>
      <div className="request-table-container">
        <h2>Teacher Requests</h2>
        <table className="request-table">
          <thead>
            <tr>
              <th>Teacher Name</th>
              <th>Request Details</th>
            </tr>
          </thead>
          <tbody>
            {/* Empty tbody to display an empty table */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MRequest;
