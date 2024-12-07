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
        const response = await axios.get(
          `https://tms.up.school/api/sessions/${sessionId}/sessionPlans`
        );
    
        setSessionPlans(response.data);
    
        console.log("Fetched session plans:", response.data);
    
        // Parse each session's topics and their concepts
        const initialData = response.data.reduce((acc, plan) => {
          acc[plan.sessionNumber] = plan.planDetails?.map((entry) => ({
            topicName: entry.topic || "",
            concepts: Array.isArray(entry.concept)
              ? entry.concept
              : entry.concept
              ? entry.concept.split(";").map((c) => c.trim())
              : [], // Parse concepts if they are a semicolon-separated string
            lessonPlan: entry.lessonPlan || "",
          })) || [];
          return acc;
        }, {});
    
        console.log("Parsed topicsWithConcepts:", initialData);
        setTopicsWithConcepts(initialData);
    
        if (response.data.length > 0) {
          setUploadDisabled(true);
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
    const merged = [];
    const topicMap = {};
  
    topics.forEach((topic) => {
      if (!topicMap[topic.name]) {
        topicMap[topic.name] = { ...topic, concepts: [] };
        merged.push(topicMap[topic.name]);
      }
      topicMap[topic.name].concepts = [
        ...topicMap[topic.name].concepts,
        ...(Array.isArray(topic.concepts) ? topic.concepts : []),
      ];
    });
  
    return merged;
  };
  
  
  

  // Add a new topic to a session
  const handleAddTopic = (sessionNumber) => {
    setTopicsWithConcepts((prev) => ({
      ...prev,
      [sessionNumber]: [
        ...(prev[sessionNumber] || []),
        { name: "", concepts: [], lessonPlan: "" },
      ],
    }));
  };

  // Save session plan
  const handleSaveSessionPlan = async (sessionPlanId, sessionNumber) => {
    try {
      setSaving(true);
      const planDetails = topicsWithConcepts[sessionNumber].map((entry) => ({
        topic: entry.name,
        concepts: entry.concepts,
        lessonPlan: entry.lessonPlan,
      }));
  
      await axios.put(`https://tms.up.school/api/sessionPlans/${sessionPlanId}`, {
        planDetails: JSON.stringify(planDetails),
      });
  
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
      await axios.post(
        `https://tms.up.school/api/sessions/${sessionId}/sessionPlans/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setFile(null);
      const response = await axios.get(
        `https://tms.up.school/api/sessions/${sessionId}/sessionPlans`
      );
      setSessionPlans(response.data);
      setUploadDisabled(true);
      setError("");
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload session plan. Please try again.");
    }
  };

  // Generate lesson plan for a specific topic
  const handleGenerateLessonPlan = async (sessionNumber, topicIndex) => {
    try {
      const topic = topicsWithConcepts[sessionNumber][topicIndex];
  
      // Ensure topic and concept are not empty
      if (!topic.name || !topic.concepts.length) {
        throw new Error("Topic name or concepts are missing.");
      }
  
      const payload = {
        board,
        grade: className,
        subject: subjectName,
        subSubject: "Civics", // Adjust if needed
        unit: unitName,
        chapter: topic.name,
        topics: [{ topic: topic.name, concepts: topic.concepts }],
        sessionType: "Theory",
        noOfSession: 1,
        duration: 45,
      };
  
      console.log("Payload for individual lesson plan:", payload);
  
      const response = await axios.post(
        "https://tms.up.school/api/dynamicLP",
        payload
      );
  
      const lessonPlan = response.data.lesson_plan;
      setTopicsWithConcepts((prev) => ({
        ...prev,
        [sessionNumber]: prev[sessionNumber].map((t, index) =>
          index === topicIndex ? { ...t, lessonPlan } : t
        ),
      }));
      setError("");
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      setError("Failed to generate lesson plan. Please try again.");
    }
  };
  
  

  // Generate lesson plans for all topics
  const handleGenerateAllLessonPlans = async () => {
    try {
      setSaving(true);
  
      const payloads = sessionPlans.flatMap((plan) => {
        const groupedTopics = mergeTopics(topicsWithConcepts[plan.sessionNumber] || []);
        return groupedTopics.map((topic) => {
          if (!topic.name || !Array.isArray(topic.concepts) || topic.concepts.length === 0) {
            console.warn(`Skipping invalid topic for session: ${plan.sessionNumber}`);
            return null;
          }
          return {
            sessionNumber: plan.sessionNumber,
            board,
            grade: className,
            subject: subjectName,
            unit: unitName,
            chapter: topic.name,
            topics: topic.concepts.map((concept) => ({ topic: topic.name, concept })),
            sessionType: "Theory",
            noOfSession: 1,
            duration: 45,
          };
        });
      }).filter(Boolean);
  
      if (payloads.length === 0) {
        setError("No valid topics to generate lesson plans.");
        setSaving(false);
        return;
      }
  
      console.log("Payloads for all topics:", payloads);
  
      const responses = await Promise.allSettled(
        payloads.map((payload) =>
          axios.post("https://tms.up.school/api/dynamicLP", payload)
        )
      );
  
      console.log("Responses for all topics:", responses);
  
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
  const handleViewLessonPlan = (lessonPlan) => {
    setCurrentLessonPlan(lessonPlan);
    setShowModal(true);
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
              <th>Lesson Plan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessionPlans.map((plan) => (
              <React.Fragment key={plan.id}>
                {mergeTopics(topicsWithConcepts[plan.sessionNumber] || []).map(
                  (topic, tIndex, topics) => (
                    <tr key={`${plan.sessionNumber}-${tIndex}`}>
                      {tIndex === 0 && (
                        <td rowSpan={topics.length}>
                          {plan.sessionNumber}
                        </td>
                      )}
                      <td>{topic.name || "No Topic Name"}</td>
                      <td>
  {Array.isArray(topic.concepts) && topic.concepts.length > 0
    ? topic.concepts.map((concept, cIndex) => (
        <div key={cIndex}>{concept}</div>
      ))
    : "No Concepts"}
</td>

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
                      {tIndex === 0 && (
                        <td rowSpan={topics.length}>
                          <button
                            onClick={() =>
                              handleSaveSessionPlan(plan.id, plan.sessionNumber)
                            }
                            disabled={saving}
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                )}
                <tr>
                  <td colSpan="5">
                    <button onClick={() => handleAddTopic(plan.sessionNumber)}>
                      + Add Topic
                    </button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
  
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Lesson Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre>{currentLessonPlan}</pre>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
  
};  

export default SessionPlans;
