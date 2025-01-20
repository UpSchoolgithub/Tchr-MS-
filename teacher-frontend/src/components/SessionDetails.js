import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import './SessionDetails.css';
import moment from 'moment'; // Install this library for date formatting

const SessionDetails = () => {
  const location = useLocation(); // Correctly use useLocation
  const navigate = useNavigate();

  const {
    teacherId = null,
    classId = null,
    sectionId = null,
    subjectId = null,
    schoolId = null,
    sessionDetails: initialSessionDetails = [],
  } = location.state || {};

  const [expandedTopic, setExpandedTopic] = useState(null);
  const [students, setStudents] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [observations, setObservations] = useState('');
  const [assignmentsEnabled, setAssignmentsEnabled] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState('');
  const [existingFile, setExistingFile] = useState(null);
  const [file, setFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [topicCompletion, setTopicCompletion] = useState({});
  
  // Fetch students for attendance
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          `/teachers/${teacherId}/sections/${sectionId}/students`
        );
        setStudents(response.data);
      } catch (error) {
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) fetchStudents();
    else setError('Section ID is missing.');
  }, [teacherId, sectionId]);

  // Fetch session details
  useEffect(() => {
    // Adjust the filtering logic to handle missing sessions for today
const fetchSessionDetails = async () => {
  try {
    const response = await axiosInstance.get(
      `/teachers/${teacherId}/sections/${sectionId}/subjects/${subjectId}/sessions`
    );

    console.log('API Response:', response.data); // Log the raw API response

    const todayDate = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    console.log('Today Date:', todayDate);

    // Filter sessions for today
    let sessions = response.data.sessions.filter((session) => {
      const sessionDate = new Date(session.sessionDate).toISOString().split('T')[0]; // Convert sessionDate to YYYY-MM-DD
      console.log('Session Date:', sessionDate, 'Today Date:', todayDate, 'Match:', sessionDate === todayDate);
      return sessionDate === todayDate;
    });

    // Fallback to show the latest session if no session is found for today
    if (sessions.length === 0 && response.data.sessions.length > 0) {
      console.warn('No sessions found for today. Falling back to the most recent session.');
      sessions = [response.data.sessions[0]]; // Fallback to the first session
    }

    if (sessions.length === 0) {
      setError('No sessions found.');
      console.log('No sessions found.');
      return;
    }

    console.log('Filtered Sessions:', sessions);

    const processedSessions = sessions.map((session) => ({
      ...session,
      sessionPlanId: session.sessionPlanId || session.sessionPlanId, // Ensure sessionPlanId is included
      topics: (session.topics || []).map((topic) => ({
        ...topic,
        completed: false,
        concepts: (topic.details || []).map((detail) => ({
          name: detail.concept,
          detailing: detail.conceptDetailing,
          lessonPlans: (detail.lessonPlans || []).map((plan) => {
            const objectivesIndex = plan.indexOf('Objectives');
            return objectivesIndex !== -1 ? plan.substring(objectivesIndex) : plan;
          }),
          completed: false,
        })),
      })),
    }));
    

    setSessionDetails(processedSessions);
    console.log('Processed Session Details:', processedSessions);
  } catch (err) {
    setError('Failed to fetch session details.');
    console.error('Error Fetching Sessions:', err);
  }
};

    
  
    if (teacherId && sectionId && subjectId) {
      fetchSessionDetails();
    }
  }, [teacherId, sectionId, subjectId]);
  

  // Track completed topics
  const [completedTopics, setCompletedTopics] = useState([]);

  // Handle checkbox change
  const handleTopicChange = (sessionIndex, topicIndex) => {
    setSessionDetails((prevDetails) => {
      const updatedDetails = prevDetails.map((session, sIdx) => {
        if (sIdx === sessionIndex) {
          return {
            ...session,
            topics: session.topics.map((topic, tIdx) =>
              tIdx === topicIndex
                ? { ...topic, completed: !topic.completed }
                : topic
            ),
          };
        }
        return session;
      });
  
      // Update completedTopics state
      const completedTopics = updatedDetails.flatMap((session) =>
        session.topics.filter((topic) => topic.completed)
      );
      setCompletedTopics(completedTopics);
  
      return updatedDetails;
    });
  };
  
  const handleConceptChange = (sessionIndex, topicIndex, conceptIndex) => {
    setSessionDetails((prevDetails) => {
      const updatedDetails = prevDetails.map((session, sIdx) =>
        sIdx === sessionIndex
          ? {
              ...session,
              topics: session.topics.map((topic, tIdx) =>
                tIdx === topicIndex
                  ? {
                      ...topic,
                      concepts: topic.concepts.map((concept, cIdx) =>
                        cIdx === conceptIndex
                          ? { ...concept, completed: !concept.completed }
                          : concept
                      ),
                      completed: topic.concepts.every(
                        (concept, cIdx) =>
                          cIdx === conceptIndex
                            ? !concept.completed // Toggle current concept
                            : concept.completed
                      ),
                    }
                  : topic
              ),
            }
          : session
      );
      return updatedDetails;
    });
  };
  
  

  const handleTopicExpand = (index) => {
    setExpandedTopic((prev) => (prev === index ? null : index));
  };

  // Check if all topics are completed
  const allTopicsCompleted =
    sessionDetails?.topics &&
    sessionDetails.topics.every((topic) => completedTopics.includes(topic.name));

  // Fetch assignment details
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        if (sessionDetails?.sessionPlanId) {
          const response = await axiosInstance.get(`/assignments/${sessionDetails.sessionPlanId}`);
          setAssignmentDetails(response.data.assignmentDetails || '');
          setExistingFile(response.data.assignmentFileUrl || null);
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
      }
    };

    if (sessionDetails?.sessionPlanId) fetchAssignmentDetails();
  }, [sessionDetails?.sessionPlanId]);

  const handleAbsenteeChange = (selectedOptions) => {
    const selectedIds = selectedOptions?.map((option) => option.value) || [];
    setAbsentees(selectedIds);
  };

  const handleSaveAttendance = async () => {
    const attendanceData = students.map((student) => ({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      status: absentees.includes(student.rollNumber) ? 'A' : 'P',
    }));

    try {
      await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/attendance`,
        { attendanceData }
      );
      alert('Attendance saved successfully!');
    } catch (error) {
      alert('Failed to save attendance.');
    }
  };

  const handleAssignmentChange = (e) => {
    setAssignmentsEnabled(e.target.value === 'Yes');
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSaveAssignment = async () => {
    try {
      const formData = new FormData();
      formData.append('sessionPlanId', sessionDetails?.sessionPlanId);
      formData.append('assignmentDetails', assignmentDetails);
      if (file) {
        formData.append('file', file);
      }

      const response = await axiosInstance.post('/api/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Assignment saved successfully!');
      setSuccessMessage(response.data.message);
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Failed to save assignment.');
    }
  };

  const handleSaveObservations = async () => {
    try {
      const response = await axiosInstance.post('/api/observations', {
        sessionPlanId: sessionDetails?.sessionPlanId,
        observations,
      });
      alert('Observations saved successfully!');
    } catch (error) {
      console.error('Error saving observations:', error);
      alert('Failed to save observations.');
    }
  };

  const handleEndSession = async () => {
    console.log('Session Details on End Session:', sessionDetails); // Debug log
  
    if (!sessionDetails || !sessionDetails[0]?.sessionId) {
      alert('Session ID is missing. Cannot end the session.');
      return;
    }
  
    const completedTopics = [];
    const incompleteTopics = [];
  
    sessionDetails[0]?.topics.forEach((topic) => {
      const completedConcepts = topic.concepts.filter((concept) => concept.completed);
      const incompleteConcepts = topic.concepts.filter((concept) => !concept.completed);
  
      if (completedConcepts.length > 0) {
        completedTopics.push({ name: topic.name, details: completedConcepts });
      }
      if (incompleteConcepts.length > 0) {
        incompleteTopics.push({ name: topic.name, details: incompleteConcepts });
      }
    });
  
    try {
      const payload = {
        completedConcepts: completedTopics.flatMap((topic) =>
          topic.details.map((concept) => ({
            id: concept.id,
            name: concept.name,
          }))
        ),
        incompleteConcepts: incompleteTopics.flatMap((topic) =>
          topic.details.map((concept) => ({
            id: concept.id,
            name: concept.name,
          }))
        ),
      };
  
      console.log('Payload for End Session:', payload);
  
      const response = await axiosInstance.post(
        `/teachers/${teacherId}/sessions/${sessionDetails[0]?.sessionId}/end`,
        payload
      );
  
      alert(response.data.message || 'Session ended successfully!');
  
      if (incompleteTopics.length > 0) {
        console.log('Carrying over incomplete topics:', incompleteTopics);
  
        const nextSessionResponse = await axiosInstance.get(
          `/teachers/${teacherId}/sections/${sectionId}/subjects/${subjectId}/sessions`
        );
  
        const nextSession = nextSessionResponse.data.sessions.find(
          (session) => session.sessionId !== sessionDetails[0]?.sessionId
        );
  
        if (nextSession && nextSession.sessionPlanId) {
          console.log('Next session found:', nextSession);
  
          await axiosInstance.post(
            `/teachers/${teacherId}/sessions/${nextSession.sessionId}/add-topics`,
            { incompleteTopics }
          );
  
          alert('Incomplete topics carried over to the next session.');
        } else {
          console.warn('No next session found to carry over topics.');
          alert('No next session found to carry over topics.');
        }
      } else {
        console.log('All topics completed. No carry-over needed.');
      }
  
      navigate(`/teacher-sessions/${teacherId}`);
    } catch (error) {
      console.error('Error ending session:', error);
  
      if (error.response) {
        alert(error.response.data.error || 'Failed to end the session.');
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };
  
  const saveTopicCompletion = async (sessionPlanId, topicId, isCompleted) => {
    try {
      await axiosInstance.patch(
        `/teachers/${teacherId}/sections/${sectionId}/subjects/${subjectId}/sessions/${sessionPlanId}/topics/${topicId}`,
        { completed: isCompleted }
      );
      setSuccessMessage('Topic completion updated successfully!');
    } catch (err) {
      setError('Failed to update topic completion.');
      console.error('Error Updating Topic:', err);
    }
  };
  
  
  
  
  

  const studentOptions = students.map((student) => ({
    value: student.rollNumber,
    label: student.studentName,
  }));


return (
  <div className="session-details-container">
    <h2>Welcome, Teacher Name!</h2>
    <div className="session-notes-section">
  <h3>Session Notes and Details:</h3>
  {sessionDetails && sessionDetails.length > 0 ? (
    sessionDetails.map((session, sessionIndex) => (
      <div key={sessionIndex} className="session-item">
        <p><strong>Chapter Name:</strong> {session.chapterName || 'N/A'}</p>
      
      <h4>Topics to Cover:</h4>
      <ul className="topics-list">
      {session.topics.map((topic, topicIndex) => (
  <li key={topicIndex}>
    <div className="topic-header">
      <input
        type="checkbox"
        id={`topic-${sessionIndex}-${topicIndex}`}
        checked={topic.completed}
        onChange={() => handleTopicChange(sessionIndex, topicIndex)}
      />
      <label>{topic.name}</label>
      <button
        onClick={() => handleTopicExpand(topicIndex)}
        className="view-lp-button"
      >
        {expandedTopic === topicIndex ? 'HIDE LP' : 'VIEW LP'}
      </button>
    </div>

    {expandedTopic === topicIndex && topicIndex === 0 && (
      <ul className="concepts-list">
        {/* Concept 1 */}
        <li>
          <div className="concept-header">
            <input
              type="checkbox"
              id={`concept-${sessionIndex}-${topicIndex}-0`}
              checked={false} // Initial state for Concept 1
              onChange={() => handleConceptChange(sessionIndex, topicIndex, 0)}
            />
            <label>Concept 1: Understanding Charge</label>
          </div>
          <p>
            <strong>Learning Objectives:</strong>
            <ul>
              <li>Understand the concept and definition of charge.</li>
              <li>Identify the two types of charges: positive and negative.</li>
              <li>Explain the interactions between charges (attraction and repulsion).</li>
              <li>Understand the concept of neutrality in atoms.</li>
            </ul>

            <strong>Lesson Plan Flow:</strong>
            <ol>
              <li>
                <strong>Introduction (3 minutes):</strong>
                <ul>
                  <li>
                    <strong>Teacher’s Introduction:</strong> "Everything around us is made up of matter, and one of the fundamental properties of matter is charge. Today, we’ll explore what charge is and its significance."
                  </li>
                  <li>
                    <strong>Engage Students:</strong> "Have you ever noticed how your hair sometimes sticks to a comb after brushing? Or how a balloon can stick to a wall after being rubbed on your clothes? These are everyday examples of charges at work."
                  </li>
                </ul>
              </li>
              <li>
                <strong>Explanation (10 minutes):</strong>
                <ul>
                  <li>
                    <strong>Concept 01: Definition of Charge</strong>
                    <ul>
                      <li>Charge is a fundamental property of matter that causes it to experience a force when placed in an electric or magnetic field.</li>
                      <li>
                        <strong>Teacher’s Note:</strong> Explain that charges cannot be seen but their effects can be observed through interactions.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Concept 02: Types of Charges</strong>
                    <ul>
                      <li>
                        <strong>Positive Charge:</strong> Associated with protons, found in the nucleus of an atom. Represented as (+).
                      </li>
                      <li>
                        <strong>Negative Charge:</strong> Associated with electrons, which orbit around the nucleus. Represented as (-).
                      </li>
                      <li>
                        <strong>Teacher’s Note:</strong> Mention that positive and negative charges are opposite in nature but equal in magnitude.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Concept 03: Nature of Interaction Between Charges</strong>
                    <ul>
                      <li>Like charges repel each other (e.g., two positive charges push away).</li>
                      <li>Opposite charges attract each other (e.g., a positive charge and a negative charge pull toward each other).</li>
                      <li>
                        <strong>Analogy:</strong> Compare charges to people with magnets: "Like poles push away, but opposite poles attract."
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Concept 04: Neutrality in Atoms</strong>
                    <ul>
                      <li>Atoms are neutral when the number of protons equals the number of electrons.</li>
                      <li>
                        <strong>Example:</strong> A hydrogen atom has 1 proton and 1 electron, making it neutral.
                      </li>
                      <li>
                        <strong>Teacher’s Note on Misconceptions:</strong>
                        <ul>
                          <li><strong>Misconception:</strong> All atoms are charged.</li>
                          <li><strong>Correction:</strong> Atoms are neutral unless they lose or gain electrons.</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
              <li>
                <strong>Recap and Clarifications (2 minutes):</strong>
                <ul>
                  <li>
                    <strong>Quick Recap Questions:</strong>
                    <ul>
                      <li>What is charge?</li>
                      <li>Name the two types of charges.</li>
                      <li>What happens when like charges come close to each other?</li>
                      <li>Why are atoms neutral?</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Recap Points:</strong> Charge is a property of matter that causes it to experience force in an electric/magnetic field. Types: Positive (proton) and Negative (electron). Like charges repel; opposite charges attract. Atoms are neutral because protons equal electrons.
                  </li>
                </ul>
              </li>
            </ol>

            <strong>Teacher Notes:</strong>
            <ul>
              <li>
                <strong>Examples for Concept Reinforcement:</strong>
                <ul>
                  <li>Balloon sticking to the wall (negative charge on the balloon, positive on the wall).</li>
                  <li>Combing hair (electrons transfer, leaving the comb negatively charged and the hair positively charged).</li>
                </ul>
              </li>
              <li>
                <strong>Analogies to Simplify Concepts:</strong>
                <ul>
                  <li>Like charges are like two people with similar interests who can’t work together.</li>
                  <li>Opposite charges are like two puzzle pieces that fit together perfectly.</li>
                </ul>
              </li>
              <li>
                <strong>Addressing Misconceptions:</strong>
                <ul>
                  <li><strong>Misconception:</strong> Only electrons carry charge.</li>
                  <li><strong>Correction:</strong> Both protons and electrons have charge, but only electrons move in most cases.</li>
                  <li><strong>Misconception:</strong> Neutral objects have no charges.</li>
                  <li><strong>Correction:</strong> Neutral objects have equal numbers of positive and negative charges.</li>
                </ul>
              </li>
            </ul>

            <strong>Assessment:</strong>
            <ul>
              <li>Ask students to answer verbally:</li>
              <ul>
                <li>What are the two types of charges?</li>
                <li>What happens when a neutral atom gains an electron?</li>
              </ul>
            </ul>
          </p>
        </li>
      </ul>
    )}
  </li>
))}


</ul>

    </div>
  ))
) : (
  <p>No session details available.</p>
)}
    </div>

    <h4>Assignments:</h4>
          {assignmentDetails && (
            <div>
              <p>Existing Assignment: {assignmentDetails}</p>
              {existingFile && (
                <p>
                  <a href={existingFile} target="_blank" rel="noopener noreferrer">
                    View Uploaded File
                  </a>
                </p>
              )}
            </div>
          )}
          <select onChange={handleAssignmentChange}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          {assignmentsEnabled && (
            <div className="assignment-input">
            <textarea
              value={assignmentDetails}
              onChange={(e) => setAssignmentDetails(e.target.value)}
              placeholder="Enter assignment details here..."
            ></textarea>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.doc,.docx,.jpg,.png" // Optional: Restrict file types
            />
            <button onClick={handleSaveAssignment}>Save</button>
          </div>
          
          )}
    <div className="observations-section">
      <h4>Observations:</h4>
      <textarea
        value={observations}
        onChange={(e) => setObservations(e.target.value)}
        className="observations-textarea"
        placeholder="Add observations of the class here..."
      ></textarea>
      <button onClick={handleSaveObservations} className="save-observations-button">
        Save Observations
      </button>
    </div>

    <div className="end-session">
      <button onClick={handleEndSession} className="end-session-button">
        End Session
      </button>
    </div>
  </div>
  
  );
};  

export default SessionDetails;
