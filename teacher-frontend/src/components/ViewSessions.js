import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ViewSessions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionPlans, hardcodedDetails } = location.state || {};

  return (
    <div>
      <h1>View Sessions</h1>
      {hardcodedDetails ? (
        <div>
          <h2>{hardcodedDetails.topicName}</h2>
          <h3>Learning Objectives</h3>
          <ul>
            {hardcodedDetails.learningObjectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
          <h3>Lesson Plan Flow</h3>
          <ol>
            {hardcodedDetails.lessonPlanFlow.map((step, index) => (
              <li key={index}>
                <strong>{step.step}</strong>
                <ul>
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex}>{detail}</li>
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
