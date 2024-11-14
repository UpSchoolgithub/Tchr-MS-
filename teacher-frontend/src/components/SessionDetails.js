import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { sectionId } = useParams(); // Get sectionId from URL parameters
  const [sessionPlans, setSessionPlans] = useState([]); // State to store session plans

  // Fetch all session plans for a specific section
  useEffect(() => {
    const fetchSessionPlans = async () => {
      try {
        const response = await axiosInstance.get(`/schools/your-school-id/classes/your-class-id/sections/${sectionId}/sessions`);
        setSessionPlans(response.data); // Set session plans from response
      } catch (error) {
        console.error('Error fetching session plans:', error);
      }
    };

    if (sectionId) {
      fetchSessionPlans();
    }
  }, [sectionId]);

  return (
    <div className="session-details-container">
      <h2>Session Plans for Section {sectionId}</h2>
      
      {sessionPlans.length === 0 ? (
        <p>No session plans found for this section.</p>
      ) : (
        <ul className="session-plan-list">
          {sessionPlans.map((plan) => (
            <li key={plan.id} className="session-plan-item">
              <strong>Session ID:</strong> {plan.id} <br />
              <strong>Chapter Name:</strong> {plan.chapterName} <br />
              <strong>Number of Sessions:</strong> {plan.numberOfSessions} <br />
              <strong>Priority Number:</strong> {plan.priorityNumber}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SessionDetails;
