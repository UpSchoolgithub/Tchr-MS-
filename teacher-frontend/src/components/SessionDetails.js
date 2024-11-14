import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const SessionDetails = () => {
  const { schoolId, classId, sectionId, subjectId } = useParams();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Only fetch if all IDs are defined
    if (schoolId && classId && sectionId && subjectId) {
      axios
        .get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions`)
        .then(response => setSessions(response.data))
        .catch(error => console.error('Error fetching sessions:', error));
    }
  }, [schoolId, classId, sectionId, subjectId]);

  const handleCheckboxChange = (sessionId, isCompleted) => {
    // Update the session's completion status when checkbox is toggled
    axios
      .put(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`, {
        completed: isCompleted,
      })
      .then(response => {
        // Update the local state to reflect the completed status
        setSessions(sessions.map(session =>
          session.id === sessionId ? { ...session, completed: isCompleted } : session
        ));
      })
      .catch(error => console.error('Error updating session completion:', error));
  };

  return (
    <div>
      <h2>Session Details</h2>
      {sessions.length > 0 ? (
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
      ) : (
        <p>No sessions available for this subject.</p>
      )}
    </div>
  );
};

export default SessionDetails;
