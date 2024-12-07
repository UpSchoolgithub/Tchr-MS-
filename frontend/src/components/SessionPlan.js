import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import "../styles.css";

const SessionPlans = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  // const [board, setBoard] = useState("");
  const [sessionPlans, setSessionPlans] = useState([]);
  const [topicsWithConcepts, setTopicsWithConcepts] = useState({});
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploadDisabled, setUploadDisabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // display school , class etc naems
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
  
  
  // Fetch board from query params
  const {
    board: boardName = "Board Not Available",
    ...rest
  } = location.state || {};
  
  const [board, setBoard] = useState(boardName);
  
  useEffect(() => {
    if (!boardName) {
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
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      setError("Failed to generate lesson plan. Please try again.");
    }
  };

    // Generate lesson plan for all topics
    const handleGenerateAllLessonPlans = async () => {
      try {
        setSaving(true);
        setSuccessMessage(""); // Clear any previous success message
    
        // Prepare payloads based on topics, concepts, and session metadata
        const payloads = [];
        sessionPlans.forEach((plan) => {
          const topics = topicsWithConcepts[plan.sessionNumber] || [];
          topics.forEach((topic) => {
            payloads.push({
              sessionNumber: plan.sessionNumber,
              board, // Use the state variable for board
              grade: className, // Class Name is already fetched
              subject: subjectName, // Use fetched subject name
              subSubject: "General", // Provide a fallback for subSubject
              unit: unitName, // Use unit name
              chapter: chapterName, // Use chapter name
              topics: topic.concepts.map((concept) => ({
                topic: topic.name,
                concept: concept, // Each concept as a sub-topic
              })),
              sessionType: "Theory", // Fixed session type for now
              noOfSession: topics.length, // Number of sessions based on topic count
              duration: 45, // Default duration for each session
            });
          });
        });
    
        console.log("Payloads to be sent:", payloads); // Debugging
    
        // Send all payloads to the backend for processing
        const responses = await Promise.all(
          payloads.map((payload) =>
            axios.post("https://tms.up.school/api/dynamicLP", payload)
          )
        );
    
        // Update topicsWithConcepts with the new lesson plans
        const updatedTopicsWithConcepts = { ...topicsWithConcepts };
        responses.forEach((response, index) => {
          const { sessionNumber } = payloads[index];
          const lessonPlan = response.data.lesson_plan;
    
          updatedTopicsWithConcepts[sessionNumber] = updatedTopicsWithConcepts[
            sessionNumber
          ].map((topic, topicIndex) => ({
            ...topic,
            lessonPlan, // Add lesson plan for the topic
          }));
        });
    
        setTopicsWithConcepts(updatedTopicsWithConcepts);
        setError("");
        setSuccessMessage("All topics' LP generated successfully!");
      } catch (error) {
        console.error("Error generating lesson plans:", error);
        setError("Failed to generate lesson plans. Please try again.");
        setSuccessMessage("");
      } finally {
        setSaving(false);
      }
    };
    
    


  // View lesson plan
  const handleViewLessonPlan = (lessonPlan) => {
    alert(`Viewing Lesson Plan: ${lessonPlan}`);
    // Replace with actual view logic, e.g., modal or new page
  };

  return (
    <div className="container">
      <h2 className="header">Session Plans</h2>
 {/* Display additional details */}
 <div className="info-banner">
      <p>
        <strong>School Name:</strong> {schoolName} | <strong>School ID:</strong> {schoolId}
      </p>
      <p>
        <strong>Class Name:</strong> {className} | <strong>Class ID:</strong> {classId}
      </p>
      <p>
        <strong>Section Name:</strong> {sectionName} | <strong>Section ID:</strong> {sectionId}
      </p>
      <p>
        <strong>Subject Name:</strong> {subjectName} | <strong>Subject ID:</strong> {subjectId}
      </p>
      <p>
        <strong>Board:</strong> {board}</p>
      <p>
        <strong>Chapter Name:</strong> {chapterName} | <strong>Unit Name:</strong> {unitName}
      </p>
    </div>

 {/* Success message */}
 {successMessage && <div className="success-message">{successMessage}</div>}

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
{/* Generate Lesson Plan Button */}
<div className="generate-controls">
  <button onClick={handleGenerateAllLessonPlans} disabled={saving}>
    {saving ? "Generating..." : "Generate All Lesson Plans"}
  </button>
  {successMessage && <div className="success-message">{successMessage}</div>}
  {error && <div className="error-message">{error}</div>}
</div>


  {/* Table for Session Plans */}
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
                      "Not Generated"
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
