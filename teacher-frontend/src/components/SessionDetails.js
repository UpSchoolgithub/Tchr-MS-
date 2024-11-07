import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { state } = useLocation();
  const session = state?.session;
  const navigate = useNavigate();

  if (!session) {
    return <p>No session data available.</p>;
  }

  const handleEndSession = () => {
    // Here you would typically update the session end status in your backend.
    console.log('End session:', session.id);
    navigate('/'); // Navigate back to the main session list after ending the session.
  };

  return (
    <div className="session-details">
      <h2>Session Notes and Details</h2>
      <div>
        <strong>Session Number:</strong> {session.sessionNumber || 'N/A'}
      </div>
      <div>
        <strong>Chapter:</strong> {session.chapter || 'N/A'}
      </div>
      <div>
        <strong>Topics to Cover:</strong>
        <ul>
          {session.topics?.map((topic, index) => (
            <li key={index}>{topic}</li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Assignments:</strong>
        <select>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div>
        <strong>Observations:</strong>
        <textarea placeholder="Enter observations here" />
      </div>
      <button onClick={handleEndSession} className="end-session-button">
        End Session
      </button>
    </div>
  );
};

export default SessionDetails;
