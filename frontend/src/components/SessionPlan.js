import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import "../styles.css";

const SessionPlans = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const [board, setBoard] = useState("");
  const [sessionPlans, setSessionPlans] = useState([]);
  const [topicsWithConcepts, setTopicsWithConcepts] = useState({});
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploadDisabled, setUploadDisabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalLessonPlan, setModalLessonPlan] = useState("");
  const [modalTopicDetails, setModalTopicDetails] = useState(null);

  // Fetch board from query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const boardParam = queryParams.get("board");
    setBoard(boardParam || "");
  }, [location]);

  // Fetch session plans
  useEffect(() => {
    const fetchSessionPlans = async () => {
      try {
        const response = await axios.get(
          `https://tms.up.school/api/sessions/${sessionId}/sessionPlans`
        );
        setSessionPlans(response.data);

        // Initialize topics and concepts
        const initialData = response.data.reduce((acc, plan) => {
          acc[plan.sessionNumber] = plan.planDetails?.map((topic) => ({
            name: topic.name || "",
            concepts: topic.concepts || [],
            lessonPlan: topic.lessonPlan || "",
          })) || [];
          return acc;
        }, {});
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
      const planDetails = topicsWithConcepts[sessionNumber].map((topic) => ({
        name: topic.name,
        concepts: topic.concepts,
        lessonPlan: topic.lessonPlan,
      }));

      await axios.put(`https://tms.up.school/api/sessionPlans/${sessionPlanId}`, {
        planDetails: JSON.stringify(planDetails),
      });

      setSaving(false);
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
      const payload = {
        board: board || "CBSE", // Replace with actual value
        grade: "10", // Replace with actual value
        subject: "Math", // Replace with actual value
        subSubject: "Algebra", // Replace with actual value
        unit: "Linear Equations", // Replace with actual value
        chapter: topic.name, // Topic name
        topics: [
          {
            topic: topic.name,
            concepts: topic.concepts,
          },
        ],
        sessionType: "Theory", // Hardcoded for now
        noOfSession: 1, // For single topic
        duration: 45, // Set a default duration
      };

      const response = await axios.post(
        "https://tms.up.school/api/dynamicLP",
        payload
      );
      const lessonPlan = response.data.lesson_plan;

      // Update the topic with the fetched lesson plan
      setTopicsWithConcepts((prev) => ({
        ...prev,
        [sessionNumber]: prev[sessionNumber].map((t, index) =>
          index === topicIndex ? { ...t, lessonPlan } : t
        ),
      }));

      setError("");
      return lessonPlan; // Return lesson plan for immediate display
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      setError("Failed to generate lesson plan. Please try again.");
    }
  };

  // View lesson plan
  const handleViewLessonPlan = async (sessionNumber, topicIndex) => {
    const topic = topicsWithConcepts[sessionNumber][topicIndex];
    if (!topic.lessonPlan) {
      const generatedPlan = await handleGenerateLessonPlan(
        sessionNumber,
        topicIndex
      );
      setModalLessonPlan(generatedPlan || "Failed to generate lesson plan.");
    } else {
      setModalLessonPlan(topic.lessonPlan);
    }
    setModalTopicDetails({ sessionNumber, topicIndex });
  };

  const handleRegenerateLessonPlan = async () => {
    if (modalTopicDetails) {
      const { sessionNumber, topicIndex } = modalTopicDetails;
      const regeneratedPlan = await handleGenerateLessonPlan(
        sessionNumber,
        topicIndex
      );
      setModalLessonPlan(regeneratedPlan || "Failed to regenerate lesson plan.");
    }
  };

  return (
    <div className="container">
      <h2 className="header">Session Plans</h2>
      {board && <p>Board: {board}</p>}
      {error && <div className="error">{error}</div>}

      {/* Lesson Plan Modal */}
      {modalLessonPlan && (
        <div className="modal">
          <div className="modal-content">
            <h3>Lesson Plan</h3>
            <pre>{modalLessonPlan}</pre>
            <div className="modal-actions">
              <button onClick={handleRegenerateLessonPlan}>Regenerate</button>
              <button onClick={() => setModalLessonPlan("")}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Session Number</th>
              <th>Topic Names</th>
              <th>Related Concepts</th>
              <th>Lesson Plan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessionPlans.map((plan) => (
              <React.Fragment key={plan.id}>
                {topicsWithConcepts[plan.sessionNumber]?.map((topic, tIndex) => (
                  <tr key={`${plan.sessionNumber}-${tIndex}`}>
                    {tIndex === 0 && (
                      <td rowSpan={topicsWithConcepts[plan.sessionNumber]?.length || 1}>
                        {plan.sessionNumber}
                      </td>
                    )}
                    <td>{topic.name}</td>
                    <td>
                      {topic.concepts.map((concept, cIndex) => (
                        <div key={cIndex}>{concept}</div>
                      ))}
                    </td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() =>
                          handleViewLessonPlan(plan.sessionNumber, tIndex)
                        }
                      >
                        View
                      </button>
                    </td>
                    {tIndex === 0 && (
                      <td rowSpan={topicsWithConcepts[plan.sessionNumber]?.length || 1}>
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
                ))}
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
    </div>
  );
};

export default SessionPlans;
