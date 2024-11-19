import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams } from 'react-router-dom';
import './SessionDetails.css';

const SessionDetails = () => {
  const { teacherId, sessionId } = useParams();
  const [sessionDetails, setSessionDetails] = useState({});
  const [sessionPlans, setSessionPlans] = useState([]);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const sessionResponse = await axiosInstance.get(
          `/sessions/${sessionId}`
        );
        setChapterName(sessionResponse.data.chapterName);
        setTopics(sessionResponse.data.topics);
      } catch (error) {
        console.error('Error fetching session details:', error);
        setError('Failed to fetch session details.');
      }
    };
  
    fetchSessionDetails();
  }, [sessionId]);
  

  const handlePlanCompletionToggle = async (planId) => {
    const updatedPlans = sessionPlans.map(plan =>
      plan.id === planId ? { ...plan, completed: !plan.completed } : plan
    );
    setSessionPlans(updatedPlans);

    try {
      await axiosInstance.put(`/api/sessionPlans/${planId}/toggle-completion`, {
        completed: !sessionPlans.find(plan => plan.id === planId).completed,
      });
    } catch (error) {
      console.error('Error updating session plan completion:', error);
    }
  };

  return (
    <div className="session-details-container">
      <h2>Session Details</h2>
      <div className="session-info">
        <p><strong>School:</strong> {sessionDetails.schoolName}</p>
        <p><strong>Class:</strong> {sessionDetails.className}</p>
        <p><strong>Section:</strong> {sessionDetails.sectionName}</p>
        <p><strong>Subject:</strong> {sessionDetails.subjectName}</p>
        <p><strong>Day:</strong> {sessionDetails.day}</p>
        <p><strong>Period:</strong> {sessionDetails.period}</p>
        <p><strong>Start Time:</strong> {sessionDetails.startTime}</p>
        <p><strong>End Time:</strong> {sessionDetails.endTime}</p>
        <p><strong>Assignments:</strong> {sessionDetails.assignments}</p>
      </div>

      <h3>Session Plans</h3>
      <ul className="session-plans-list">
        {sessionPlans.map(plan => (
          <li key={plan.id}>
            <label>
              <input
                type="checkbox"
                checked={plan.completed}
                onChange={() => handlePlanCompletionToggle(plan.id)}
              />
              {plan.planDetails.join(', ')} {/* Display plan details as comma-separated items */}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SessionDetails;
