import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import "../styles.css";

const SessionPlans = () => {
  const { sessionId } = useParams();
  const location = useLocation();

  // State to hold dynamic values and data
  const [board, setBoard] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [sessionPlans, setSessionPlans] = useState([]);
  const [topicsWithConcepts, setTopicsWithConcepts] = useState({});
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploadDisabled, setUploadDisabled] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch session details (board, grade, subject, unit) from query params or API
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setBoard(queryParams.get("board") || "CBSE");
    setGrade(queryParams.get("grade") || "10");
    setSubject(queryParams.get("subject") || "Math");
    setUnit(queryParams.get("unit") || "Algebra");
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
  const handleGenerateLessonPlan = async (sessionNumber, topicIndex, sessionPlanId) => {
    try {
      const topic = topicsWithConcepts[sessionNumber][topicIndex];
      const payload = {
        board,
        grade,
        subject,
        subSubject: unit,
        unit,
        chapter: topic.name,
        topics: [
          {
            topic: topic.name,
            concepts: topic.concepts,
          },
        ],
        sessionType: "Theory",
        noOfSession: 1,
        duration: 45,
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

      // Save the lesson plan to the database
      const updatedPlanDetails = topicsWithConcepts[sessionNumber].map((t) => ({
        name: t.name,
        concepts: t.concepts,
        lessonPlan: t.lessonPlan || (t === topic ? lessonPlan : ""),
      }));

      await axios.put(`https://tms.up.school/api/sessionPlans/${sessionPlanId}`, {
        planDetails: JSON.stringify(updatedPlanDetails),
      });

      setError("");
    } catch (error) {
      console.error("Error generating or saving lesson plan:", error);
      setError("Failed to generate or save the lesson plan. Please try again.");
    }
  };

  // View lesson plan
  const handleViewLessonPlan = (lessonPlan) => {
    alert(`Viewing Lesson Plan:\n\n${lessonPlan}`);
  };

  return (
    <div className="container">
      <h2 className="header">Session Plans</h2>
      {board && <p>Board: {board}</p>}
      {error && <div className="error">{error}</div>}

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
                      {topic.lessonPlan ? (
                        <button
                          className="view-button"
                          onClick={() => handleViewLessonPlan(topic.lessonPlan)}
                        >
                          View
                        </button>
                      ) : (
                        <button
                          className="generate-button"
                          onClick={() =>
                            handleGenerateLessonPlan(plan.sessionNumber, tIndex, plan.id)
                          }
                        >
                          Generate
                        </button>
                      )}
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
