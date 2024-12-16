import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "../styles.css";

const SessionPlans = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const [sessionPlans, setSessionPlans] = useState([]);
  const [topicsWithConcepts, setTopicsWithConcepts] = useState({});
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploadDisabled, setUploadDisabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentLessonPlan, setCurrentLessonPlan] = useState("");
  const [currentSessionPlanId, setCurrentSessionPlanId] = useState(null); // Store current session plan ID
  const [currentTopicIndex, setCurrentTopicIndex] = useState(null); // Store current topic index

  const [savingPlan, setSavingPlan] = useState(false);

  const {
    schoolName = "School Name Not Available",
    schoolId,
    className = "Class Name Not Available",
    classId,
    sectionName = "Section Name Not Available",
    sectionId,
    subjectName = "Subject Name Not Available",
    subjectId,
    chapterName = "Chapter Name Not Available",
    unitName = "Unit Name Not Available",
  } = location.state || {};
  
  const boardName = location.state?.board || "Board Not Available";
  const [board, setBoard] = useState(boardName);
  
  useEffect(() => {
    if (boardName === "Board Not Available") {
      const queryParams = new URLSearchParams(location.search);
      const boardParam = queryParams.get("board");
      setBoard(boardParam || "Board Not Available");
    }
  }, [boardName, location]);
  

  // Fetch session plans
  useEffect(() => {
    const fetchSessionPlans = async () => {
      try {
        const response = await axios.get(`https://tms.up.school/api/sessions/${sessionId}/sessionPlans`);
    
        if (response.data && Array.isArray(response.data.sessionPlans)) {
          // Deduplicate session plans based on sessionNumber
          const deduplicatedSessions = {};
          response.data.sessionPlans.forEach((plan) => {
            if (!deduplicatedSessions[plan.sessionNumber]) {
              deduplicatedSessions[plan.sessionNumber] = { ...plan, Topics: [] };
            }
            // Merge topics for the session
            if (Array.isArray(plan.Topics)) {
              deduplicatedSessions[plan.sessionNumber].Topics.push(...plan.Topics);
            }
          });
    
          // Transform into the required format
          const initialData = Object.values(deduplicatedSessions).reduce((acc, plan) => {
            const topics = mergeTopics(plan.Topics || []);
            console.log("Valid Topics:", topics); // Debug valid topics
          
            acc[plan.sessionNumber] = topics.map((topic) => ({
              name: topic.name || "Unnamed Topic",
              concepts: topic.concepts || [],
              conceptDetailing: topic.conceptDetailing || [],
              lessonPlan: "",
            }));
            return acc;
          }, {});
          
    
          setTopicsWithConcepts(initialData);
          setSessionPlans(Object.values(deduplicatedSessions));
        } else {
          throw new Error("Invalid session plans format from API.");
        }
      } catch (error) {
        console.error("Error fetching session plans:", error);
        setError("Failed to fetch session plans.");
      }
    };
    
    
    
    
  
    fetchSessionPlans();
  }, [sessionId]);
  
  
  
  
  
  // Utility to merge topics with the same name
  const mergeTopics = (topics) => {
    const topicMap = {}; // To track unique topics by name
  
    topics.forEach((topic) => {
      if (!topic || !topic.topicName || !Array.isArray(topic.Concepts)) return; // Skip invalid topics
  
      if (!topicMap[topic.topicName]) {
        topicMap[topic.topicName] = {
          name: topic.topicName,
          concepts: [],
          conceptDetailing: [],
        };
      }
  
      // Merge valid concepts and details
      topic.Concepts.forEach((concept) => {
        if (concept.concept && !topicMap[topic.topicName].concepts.includes(concept.concept)) {
          topicMap[topic.topicName].concepts.push(concept.concept);
          topicMap[topic.topicName].conceptDetailing.push(concept.conceptDetailing || "");
        }
      });
    });
  
    return Object.values(topicMap).filter(topic => topic.concepts.length > 0); // Return topics with valid concepts
  };
  
  
  
  
  
  

  // Add a new topic to a session
  const handleAddTopic = (sessionNumber) => {
    setTopicsWithConcepts((prev) => {
      if (!prev[sessionNumber]) {
        prev[sessionNumber] = [];
      }
  
      return {
        ...prev,
        [sessionNumber]: [
          ...prev[sessionNumber],
          {
            name: "New Topic",
            concepts: ["New Concept"], // Ensure at least one concept
            conceptDetailing: ["Provide details here"], // Ensure at least one detailing
            lessonPlan: "",
          },
        ],
      };
    });
  };
  
  

  // Save session plan
  const handleSaveSessionPlan = async (sessionPlanId, sessionNumber) => {
    const planDetails = topicsWithConcepts[sessionNumber].map((entry) => ({
      topic: entry.name?.trim() || "Unnamed Topic",
      concepts: entry.concepts.filter((c) => c.trim().length > 0),
      conceptDetailing: entry.conceptDetailing,
      lessonPlan: entry.lessonPlan,
    }));
  
    // Validate topics and concepts
    if (
      planDetails.some(
        (detail) =>
          !detail.topic ||
          detail.concepts.length === 0 ||
          detail.concepts.length !== detail.conceptDetailing.length
      )
    ) {
      setError(
        "Some topics or concepts are missing or mismatched with their detailing. Please fix them before saving."
      );
      return;
    }
  
    try {
      setSaving(true);
      await axios.put(`https://tms.up.school/api/sessionPlans/${sessionPlanId}`, { planDetails });
  
      setSaving(false);
      setSuccessMessage("Session plan saved successfully!");
      setError("");
    } catch (error) {
      console.error("Error saving session plan:", error);
      setError("Failed to save session plan. Please try again.");
      setSaving(false);
    }
  };
  
  
  
  

  // Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await axios.post(
        `https://tms.up.school/api/sessions/${sessionId}/sessionPlans/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
  
      if (response.data.skippedRows > 0) {
        setError(
          `${response.data.skippedRows} rows were skipped due to errors: ${response.data.errors
            .map((err) => `Row ${err.row}: ${err.reason}`)
            .join(", ")}`
        );
      } else {
        setSuccessMessage("Session plans uploaded successfully.");
      }
  
      const updatedPlans = await axios.get(
        `https://tms.up.school/api/sessions/${sessionId}/sessionPlans`
      );
      setSessionPlans(updatedPlans.data);
      setUploadDisabled(true);
      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload session plan. Please try again.");
    }
  };
  
  

  // Generate lesson plan for a specific topic
  const handleGenerateLessonPlan = async (sessionNumber, topicIndex) => {
    try {
      const topic = topicsWithConcepts[sessionNumber][topicIndex];
      if (!topic.name || !Array.isArray(topic.concepts) || topic.concepts.length === 0) {
        setError(`Topic "${topic.name || "Unnamed"}" is missing concepts or invalid.`);
        return;
      }
  
      const payload = {
        board,
        grade: className,
        subject: subjectName,
        unit: unitName,
        chapter: topic.name,
        concepts: topic.concepts.map((concept, index) => ({
          concept,
          detailing: topic.conceptDetailing[index] || "No detailing provided.",
        })),
        sessionType: "Theory",
        noOfSession: 1,
        duration: 45,
      };
  
      const response = await axios.post("https://tms.up.school/api/dynamicLP", payload);
  
      const generatedLessonPlan = response.data.lesson_plan;
  
      setTopicsWithConcepts((prev) => ({
        ...prev,
        [sessionNumber]: prev[sessionNumber].map((t, idx) =>
          idx === topicIndex ? { ...t, lessonPlan: generatedLessonPlan } : t
        ),
      }));
  
      setSuccessMessage(`Lesson plan for topic "${topic.name}" generated successfully!`);
      setError("");
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      setError(`Failed to generate lesson plan for topic "${topicsWithConcepts[sessionNumber][topicIndex]?.name}".`);
    }
  };
  
  
  
  
  
  
  

  // Generate lesson plans for all topics
  const handleGenerateAllLessonPlans = async () => {
    try {
      setSaving(true);
  
      const payloads = Object.entries(topicsWithConcepts).flatMap(([sessionNumber, topics]) => {
        return topics
          .map((topic) => {
            if (
              !topic.name ||
              !Array.isArray(topic.concepts) ||
              topic.concepts.length === 0
            ) {
              console.warn(`Skipping invalid topic: ${topic.name || "Unnamed Topic"}`);
              return null;
            }
      
            const validTopics = topic.concepts
              .map((concept, index) => {
                const detailing = topic.conceptDetailing[index];
                if (concept && detailing) {
                  return {
                    topic: topic.name,
                    concept,
                    detailing,
                  };
                }
                return null;
              })
              .filter(Boolean); // Remove invalid entries
      
            if (validTopics.length === 0) {
              console.warn(`Skipping topic with no valid concepts: ${topic.name}`);
              return null;
            }
      
            return {
              sessionNumber,
              board,
              grade: className,
              subject: subjectName,
              unit: unitName,
              chapter: topic.name,
              topics: validTopics, // Use only valid topics
              sessionType: "Theory",
              noOfSession: 1,
              duration: 45,
            };
          })
          .filter(Boolean); // Remove null payloads
      });
      
  
      console.log("Payloads for Lesson Plan Generation:", payloads);
if (payloads.length === 0) {
  setError("No valid topics to generate lesson plans.");
  setSaving(false);
  return;
}

  
      console.log("Payloads for all topics:", payloads);
  
      const responses = await Promise.allSettled(
        payloads.map((payload) => axios.post("https://tms.up.school/api/dynamicLP", payload))
      );
  
      // Update state with generated lesson plans
      responses.forEach((response, index) => {
        if (response.status === "fulfilled") {
          const { sessionNumber, chapter } = payloads[index];
          const generatedLessonPlan = response.value.data.lesson_plan;
  
          setTopicsWithConcepts((prev) => ({
            ...prev,
            [sessionNumber]: prev[sessionNumber].map((topic) =>
              topic.name === chapter ? { ...topic, lessonPlan: generatedLessonPlan } : topic
            ),
          }));
        }
      });
  
      setSuccessMessage("All topics' LP generated successfully!");
      setError("");
    } catch (error) {
      console.error("Error generating all lesson plans:", error);
      setError("Failed to generate lesson plans. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  
  
  
  
  
  

  // View lesson plan
  const handleViewLessonPlan = (lessonPlan, sessionPlanId, topicIndex) => {
    setCurrentLessonPlan(lessonPlan);
    setCurrentSessionPlanId(sessionPlanId);
    setCurrentTopicIndex(topicIndex);
    setShowModal(true);
  };

  // Save lesson plan to the database
  const handleSaveLessonPlan = async () => {
    if (!currentLessonPlan) {
        setError('No lesson plan to save.');
        return;
    }

    try {
        const response = await axios.post(
            `https://tms.up.school/api/sessionPlans/${currentLessonPlan.id}/saveLessonPlan`,
            {
                updatedLessonPlan: {
                    topicName: currentLessonPlan.topicName,
                    concept: currentLessonPlan.concept,
                    lessonPlan: currentLessonPlan.lessonPlan,
                },
            }
        );

        if (response.status === 200) {
            setSuccessMessage('Lesson plan saved successfully!');
        } else {
            setError('Failed to save lesson plan. Please try again.');
        }
    } catch (error) {
        console.error('Error saving lesson plan:', error);
        setError('An error occurred while saving the lesson plan.');
    }
};


  return (
    <div className="container">
      <h2 className="header">Session Plans</h2>
      <div className="info-banner">
        <p>
          <strong>School Name:</strong> {schoolName} | <strong>School ID:</strong>{" "}
          {schoolId}
        </p>
        <p>
          <strong>Class Name:</strong> {className} | <strong>Class ID:</strong>{" "}
          {classId}
        </p>
        <p>
          <strong>Section Name:</strong> {sectionName} | <strong>Section ID:</strong>{" "}
          {sectionId}
        </p>
        <p>
          <strong>Subject Name:</strong> {subjectName} | <strong>Subject ID:</strong>{" "}
          {subjectId}
        </p>
        <p>
          <strong>Board:</strong> {board}
        </p>
        <p>
          <strong>Chapter Name:</strong> {chapterName} | <strong>Unit Name:</strong>{" "}
          {unitName}
        </p>
      </div>
  
      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}
  
      <div className="top-controls">
        <form onSubmit={handleFileUpload} className="form-group">
          <label>Upload Session Plans via Excel:</label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={uploadDisabled}
          />
          <button type="submit" disabled={uploadDisabled}>
            Upload
          </button>
        </form>
      </div>
  
      <div className="generate-controls">
        <button onClick={handleGenerateAllLessonPlans} disabled={saving}>
          {saving ? "Generating..." : "Generate All Lesson Plans"}
        </button>
      </div>
  
      <div className="table-container">
      <table>
  <thead>
    <tr>
      <th>Session Number</th>
      <th>Topic Name</th>
      <th>Concept</th>
      <th>Concept Detailing</th>
      <th>Lesson Plan</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
  {Array.isArray(sessionPlans) && sessionPlans.length > 0 ? (
  sessionPlans.map((plan) => (
    <React.Fragment key={plan.id}>
      {(topicsWithConcepts[plan.sessionNumber] || []).map((topic, tIndex) =>
        topic.concepts.map((concept, cIndex) => (
          <tr key={`${plan.id}-${tIndex}-${cIndex}`}>
            {/* Render Session Number once per session */}
            {tIndex === 0 && cIndex === 0 && (
              <td
                rowSpan={(topicsWithConcepts[plan.sessionNumber] || []).reduce(
                  (acc, t) => acc + t.concepts.length,
                  0
                )}
              >
                {plan.sessionNumber}
              </td>
            )}

            {/* Render Topic Name once per topic */}
            {cIndex === 0 && (
              <td rowSpan={topic.concepts.length}>
                {topic.name || "No Topic Name"}
              </td>
            )}

            {/* Render Concept */}
            <td>{concept || "No Concept"}</td>

            {/* Render Concept Detailing */}
            <td>
              <input
                type="text"
                value={topic.conceptDetailing[cIndex] || ""}
                placeholder="Enter concept details"
                onChange={(e) =>
                setTopicsWithConcepts((prev) => {
                  const updatedTopics = { ...prev };
                  if (!updatedTopics[plan.sessionNumber]) return prev; // Ensure session exists
                  if (!updatedTopics[plan.sessionNumber][tIndex]) return prev; // Ensure topic exists
                  updatedTopics[plan.sessionNumber][tIndex].conceptDetailing[cIndex] =
                    e.target.value;
                  return updatedTopics;
                })
              }
              />
            </td>

            {/* Render Lesson Plan Button */}
            <td>
              {topic.lessonPlan ? (
                <button
                  className="view-button"
                  onClick={() => handleViewLessonPlan(topic.lessonPlan)}
                >
                  View
                </button>
              ) : (
                "Not Generated"
              )}
            </td>

            {/* Render Actions (Save Button) */}
            {tIndex === 0 && cIndex === 0 && (
              <td
                rowSpan={(topicsWithConcepts[plan.sessionNumber] || []).reduce(
                  (acc, t) => acc + t.concepts.length,
                  0
                )}
              >
                <button
                  onClick={() => handleSaveSessionPlan(plan.id, plan.sessionNumber)}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </td>
            )}
          </tr>
        ))
      )}
      <tr>
        <td colSpan="6">
          <button onClick={() => handleAddTopic(plan.sessionNumber)}>+ Add Topic</button>
        </td>
      </tr>
    </React.Fragment>
  ))
) : (
  <tr>
    <td colSpan="6">No session plans available. Please upload or create a new one.</td>
  </tr>
)}

</tbody>

</table>

      </div>
  
      <Modal show={showModal} onHide={() => setShowModal(false)}>
    <Modal.Header closeButton>
        <Modal.Title>Lesson Plan</Modal.Title>
    </Modal.Header>
    <Modal.Body>
        <pre>{currentLessonPlan.lessonPlan}</pre>
    </Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
        </Button>
        <Button variant="primary" onClick={handleSaveLessonPlan}>
            Save Plan
        </Button>
    </Modal.Footer>
</Modal>;
    </div>
  );
  
};  

export default SessionPlans;
