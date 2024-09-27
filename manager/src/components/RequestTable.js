import React from 'react';

const RequestTable = ({ requests }) => {
  return (
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
          {requests.map((request, index) => (
            <tr key={index}>
              <td>{request.teacherName}</td>
              <td>{request.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RequestTable;
