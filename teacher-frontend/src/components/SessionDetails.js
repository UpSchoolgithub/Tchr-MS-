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
    <div className="session-details-header">
      <p><strong>School ID:</strong> {schoolId || 'Not Available'}</p>
      <p><strong>Class ID:</strong> {classId || 'Not Available'}</p>
      <p><strong>Teacher ID:</strong> {teacherId || 'Not Available'}</p>
      <p><strong>Section ID:</strong> {sectionId || 'Not Available'}</p>
      <p><strong>Subject ID:</strong> {subjectId || 'Not Available'}</p>
    </div>

    <h2>Welcome, Teacher Name!</h2>

    <div className="session-notes-section">
  <h3>Session Notes and Details:</h3>
  {sessionDetails && sessionDetails.length > 0 ? (
    sessionDetails.map((session, sessionIndex) => (
      <div key={sessionIndex} className="session-item">
        <p><strong>Session ID:</strong> {session.sessionId || 'N/A'}</p>
        <p><strong>Session Plan ID:</strong> {session.sessionPlanId || 'Missing'}</p>

        <p><strong>Chapter Name:</strong> {session.chapterName || 'N/A'}</p>
        <p><strong>Status:</strong> {session.status === 'completed' ? 'Completed' : 'Incomplete'}</p>
        
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
            onChange={() =>
              handleConceptChange(sessionIndex, topicIndex, 0)
            }
          />
          <label>
            Concept 1: Electric Field Created by Positive and Negative Charges
          </label>
        </div>
        <div>
          <p>
            <strong>Lesson Objectives:</strong>
            <div className="shaded-box">
              <ul>
                <li>Define an electric field and its importance in understanding electric forces.</li>
                <li>Explain the behavior of electric field lines for positive and negative charges.</li>
                <li>Represent electric fields using diagrams for various charge configurations.</li>
              </ul>
            </div>
          </p>
          <p>
            <strong>Materials Needed:</strong>
            <div className="shaded-box">
              <ul>
                <li>Whiteboard and markers</li>
                <li>Diagrams illustrating electric field lines for positive and negative charges</li>
                <li>A set of prepared electric field diagrams for group activity</li>
                <li>Worksheet with practice questions</li>
              </ul>
            </div>
          </p>
          <p>
            <strong>Lesson Structure:</strong>
            <div className="shaded-box">
              <ol>
                <li>
                  <strong>Introduction (2 minutes):</strong>
                  <ul>
                    <li>Begin by asking students: "What do you understand by the term field in physics?"</li>
                    <li>Briefly introduce the concept of an electric field as the region around a charge where its influence can be felt.</li>
                  </ul>
                </li>
                <li>
                  <strong>Explanation and Discussion (8 minutes):</strong>
                  <ul>
                    <li>
                      <strong>Part A: Definition of Electric Field</strong>
                      <ul>
                        <li>Define electric field as a region around a charged particle where a force is experienced by another charge.</li>
                        <li>Formula: Electric Field (E) = Force (F) / Charge (q) [E = F/q]</li>
                        <li>SI Unit: Newton per Coulomb (N/C)</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Part B: Electric Field Lines</strong>
                      <ul>
                        <li>Electric Field Lines for Positive Charges:</li>
                        <ul>
                          <li>Radiate outward, representing repulsion from the positive charge.</li>
                          <li>Indicate the direction a positive test charge would move.</li>
                        </ul>
                        <li>Electric Field Lines for Negative Charges:</li>
                        <ul>
                          <li>Point inward, representing attraction to the negative charge.</li>
                          <li>Indicate the direction a positive test charge would move toward the charge.</li>
                        </ul>
                        <li>Electric field lines never cross and are denser where the field is stronger.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Part C: Representation Using Diagrams</strong>
                      <ul>
                        <li>Draw simple diagrams on the board showing electric fields for a single positive charge and a single negative charge.</li>
                        <li>Explain how multiple charges (e.g., dipoles) create complex electric fields.</li>
                        <li>Encourage students to sketch basic electric field configurations.</li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Recap and Quick Assessment (5 minutes):</strong>
                  <ul>
                    <li>Summarize the key points.</li>
                    <li>Distribute a worksheet or ask:</li>
                    <ul>
                      <li>Define an electric field.</li>
                      <li>Describe the behavior of electric field lines for a positive charge.</li>
                      <li>Explain why electric field lines for negative charges point inward.</li>
                      <li>Draw a diagram representing the electric field lines around a dipole (positive and negative charges).</li>
                    </ul>
                  </ul>
                </li>
              </ol>
            </div>
          </p>
        </div>
      </li>
    
      {/* Concept 2 */}
      <li>
        <div className="concept-header">
          <input
            type="checkbox"
            id={`concept-${sessionIndex}-${topicIndex}-1`}
            checked={false} // Initial state for Concept 2
            onChange={() =>
              handleConceptChange(sessionIndex, topicIndex, 1)
            }
          />
          <label>
            Concept 2: Interaction Between Charges
          </label>
        </div>
        <div>
          <p>
            <strong>Lesson Objectives:</strong>
            <div className="shaded-box">
              <ul>
                <li>Understand how electric field lines represent interactions between charges.</li>
                <li>Describe the interaction of field lines between positive-positive, positive-negative, and negative-negative charges.</li>
                <li>Illustrate the behavior of field lines for different charge configurations using diagrams.</li>
              </ul>
            </div>
          </p>
          <p>
            <strong>Materials Needed:</strong>
            <div className="shaded-box">
              <ul>
                <li>Whiteboard and markers</li>
                <li>Diagrams illustrating field line interactions between charges</li>
                <li>Flashcards or colored tokens to represent charges</li>
                <li>Worksheet with practice diagrams and questions</li>
              </ul>
            </div>
          </p>
          <p>
            <strong>Lesson Structure:</strong>
            <div className="shaded-box">
              <ol>
                <li>
                  <strong>Introduction (2 minutes):</strong>
                  <ul>
                    <li>Start with a question: "What happens when two like charges or opposite charges are brought close to each other?"</li>
                    <li>Briefly explain that the interaction of charges can be visualized using electric field lines.</li>
                  </ul>
                </li>
                <li>
                  <strong>Explanation and Discussion (8 minutes):</strong>
                  <ul>
                    <li>
                      <strong>Part A: Interaction Between Positive and Positive Charges (2 minutes)</strong>
                      <ul>
                        <li>Field lines repel each other and move outward, indicating repulsion.</li>
                        <li>No crossing of field lines; they curve away from each other.</li>
                        <li>Draw a diagram showing two positive charges with their field lines.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Part B: Interaction Between Positive and Negative Charges (3 minutes)</strong>
                      <ul>
                        <li>Field lines originate from the positive charge and terminate at the negative charge.</li>
                        <li>Indicates attraction between the charges.</li>
                        <li>The density of lines shows the strength of the interaction.</li>
                        <li>Draw a diagram representing the interaction of field lines between a positive and a negative charge.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Part C: Interaction Between Negative and Negative Charges (2 minutes)</strong>
                      <ul>
                        <li>Field lines move inward toward each charge, but they repel each other.</li>
                        <li>Lines curve outward between the two charges, representing repulsion.</li>
                        <li>Draw a diagram showing two negative charges with their field lines.</li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Recap and Quick Assessment (5 minutes):</strong>
                  <ul>
                    <li>Summarize the key points and interactions.</li>
                    <li>Distribute a worksheet or ask:</li>
                    <ul>
                      <li>What do electric field lines indicate about the interaction between charges?</li>
                      <li>Describe the interaction of field lines between two positive charges.</li>
                      <li>Draw the field lines for a positive and a negative charge.</li>
                      <li>Explain the behavior of field lines between two negative charges.</li>
                    </ul>
                  </ul>
                </li>
              </ol>
            </div>
          </p>
        </div>
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
