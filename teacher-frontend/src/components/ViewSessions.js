import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ViewSessions.css';

const ViewSessions = () => {
  const location = useLocation();
  const { sessionPlans, hardcodedDetails } = location.state || {};
  const navigate = useNavigate();

  return (
    <div className="view-sessions-container">
      <h1>Session Plan</h1>
      {hardcodedDetails ? (
        <div>
          <h2>{hardcodedDetails.topicName}</h2>
          <h3>Learning Objectives:</h3>
          <ul>
            {hardcodedDetails.learningObjectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
          <h3>Lesson Plan Flow:</h3>
          <ol>
            {hardcodedDetails.lessonPlanFlow.map((flow, index) => (
              <li key={index}>
                <strong>{flow.step}</strong>
                <ul>
                  {flow.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <button onClick={() => navigate(-1)}>Back</button>
        </div>
      ) : (
        <p>No session details available.</p>
      )}
    </div>
  );
};

export default ViewSessions;
