import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SessionDetails = ({ schoolId, classId, sectionId, subjectId }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Fetch sessions for the specific class, section, and subject
    axios.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions`)
      .then(response => setSessions(response.data))
      .catch(error => console.error('Error fetching sessions:', error));
  }, [schoolId, classId, sectionId, subjectId]);

  const handleCheckboxChange = (sessionId, isCompleted) => {
    // Update the session's completion status on checkbox toggle
    axios.put(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`, {
      completed: isCompleted
    })
    .then(response => {
      setSessions(sessions.map(session => 
        session.id === sessionId ? { ...session, completed: isCompleted } : session
      ));
    })
    .catch(error => console.error('Error updating session completion:', error));
  };

  return (
    <div>
      <h2>Session Details</h2>
      <ul>
        {sessions.map(session => (
          <li key={session.id}>
            <input
              type="checkbox"
              checked={session.completed || false}
              onChange={(e) => handleCheckboxChange(session.id, e.target.checked)}
            />
            {session.chapterName} - Priority: {session.priorityNumber} - Sessions: {session.numberOfSessions}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SessionDetails;
