import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "../styles.css";
import { jsPDF } from "jspdf";

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
  const [lessonPlanContent, setLessonPlanContent] = useState('');

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
          const deduplicatedSessions = {};
          response.data.sessionPlans.forEach((plan) => {
            if (!deduplicatedSessions[plan.sessionNumber]) {
              deduplicatedSessions[plan.sessionNumber] = { ...plan, Topics: [] };
            }
            if (Array.isArray(plan.Topics)) {
              deduplicatedSessions[plan.sessionNumber].Topics.push(...plan.Topics);
            }
          });
    
          const initialData = Object.values(deduplicatedSessions).reduce((acc, plan) => {
            const topics = mergeTopics(plan.Topics || []);
            acc[plan.sessionNumber] = topics.map((topic) => ({
              name: topic.name || "Unnamed Topic",
              concepts: topic.concepts || [],
              conceptDetailing: topic.conceptDetailing || [],
              lessonPlan: topic.lessonPlan || "",
            }));
            return acc;
          }, {});
    
          setTopicsWithConcepts(initialData);
          setSessionPlans(Object.values(deduplicatedSessions));
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
    const topicMap = {};
  
    topics.forEach((topic) => {
      if (!topic?.topicName || !Array.isArray(topic.Concepts)) {
        console.warn("Invalid topic skipped:", topic);
        return;
      }
  
      if (!topicMap[topic.topicName]) {
        topicMap[topic.topicName] = {
          name: topic.topicName.trim(),
          concepts: [], // Store full concept objects
        };
      }
  
      topic.Concepts.forEach((concept) => {
        if (concept?.id && concept?.concept) {
          topicMap[topic.topicName].concepts.push({
            id: concept.id, // Include concept ID
            name: concept.concept.trim(), // Concept name
            detailing: concept.conceptDetailing?.trim() || "", // Concept detailing
          });
        } else {
          console.warn("Invalid concept skipped:", concept);
        }
      });
    });
  
    return Object.values(topicMap).filter((topic) => topic.concepts.length > 0);
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
          concept: concept.name,
          detailing: concept.detailing || "No detailing provided.",
        })),
        sessionType: "Theory",
        noOfSession: 1,
        duration: 45,
      };
  
      const response = await axios.post("https://tms.up.school/api/dynamicLP", payload);
  
      const generatedLessonPlan = response.data.lesson_plan;
  
      // Update state with generated lesson plan
      setTopicsWithConcepts((prev) => ({
        ...prev,
        [sessionNumber]: prev[sessionNumber].map((t, idx) =>
          idx === topicIndex ? { ...t, lessonPlan: generatedLessonPlan } : t
        ),
      }));
  
      // Call save function to save the lesson plan
      const conceptId = topic.concepts[0]?.id; // Assuming concept ID exists
      await handleSaveLessonPlan(conceptId, generatedLessonPlan);
  
      setSuccessMessage(`Lesson plan for topic "${topic.name}" generated and saved successfully!`);
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
  
      const payloads = Object.entries(topicsWithConcepts).flatMap(([sessionNumber, topics]) =>
        topics.map((topic) => {
          const formattedTopics = topic.concepts.map((concept, index) => ({
            topic: topic.name.trim(),
            concept: typeof concept === "string" ? concept.trim() : "",
            detailing: topic.conceptDetailing[index]?.trim() || "No detailing provided",
          }));
  
          return {
            sessionNumber: sessionNumber.toString(),
            board: board?.trim() || "Unknown Board",
            grade: className?.trim() || "Unknown Grade",
            subject: subjectName?.trim() || "Unknown Subject",
            unit: unitName?.trim() || "Unknown Unit",
            chapter: topic.name?.trim(),
            topics: formattedTopics,
            sessionType: "Theory",
            noOfSession: 1,
            duration: 45,
          };
        })
      );
  
      const responses = await Promise.allSettled(
        payloads.map((payload) =>
          axios.post("https://tms.up.school/api/dynamicLP", payload)
        )
      );
  
      // Update topicsWithConcepts state with generated lesson plans
      const updatedState = { ...topicsWithConcepts };
      responses.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const payload = payloads[index];
          const sessionNumber = payload.sessionNumber;
  
          updatedState[sessionNumber] = updatedState[sessionNumber].map((topic) =>
            topic.name === payload.chapter
              ? { ...topic, lessonPlan: result.value.data.lesson_plan }
              : topic
          );
        }
      });
  
      setTopicsWithConcepts(updatedState);
      setSuccessMessage("All lesson plans generated and updated successfully!");
    } catch (error) {
      console.error("Error generating lesson plans:", error);
      setError("Failed to generate all lesson plans.");
    } finally {
      setSaving(false);
    }
  };
  
  
  
  
  
  
  
  
  
  

  // View lesson plan
  const handleViewLessonPlan = async (conceptId) => {
    console.log("Concept ID Passed:", conceptId); // Debugging
  
    if (!conceptId) {
      setError("Concept ID is missing. Cannot fetch lesson plan.");
      console.error("Concept ID is undefined or null.");
      return;
    }
  
    // Proceed with API call
    try {
      const response = await axios.get(
        `https://tms.up.school/api/sessionPlans/${conceptId}/view`
      );
      console.log("Lesson Plan Fetched:", response.data);
  
      setLessonPlanContent(response.data.lessonPlan || "No Lesson Plan Found");
      setShowModal(true);
      setError("");
    } catch (error) {
      console.error("Error fetching lesson plan:", error.message);
      setLessonPlanContent("Failed to fetch lesson plan.");
      setShowModal(true);
    }
  };
  
  
  
  
  
  

  // Save lesson plan to the database
  const handleSaveLessonPlan = async (conceptId, generatedLessonPlan) => {
    if (!conceptId || !generatedLessonPlan) {
      console.error("Missing conceptId or lessonPlan content");
      setError("Cannot save. Missing required data.");
      return;
    }
  
    try {
      // Call backend to save the generated lesson plan
      await axios.put(`https://tms.up.school/api/sessionPlans/${conceptId}/save`, {
        lessonPlan: generatedLessonPlan,
      });
  
      setSuccessMessage("Lesson plan saved successfully!");
      setError("");
    } catch (error) {
      console.error("Error saving lesson plan:", error);
      setError("Failed to save the lesson plan. Please try again.");
    }
  };
  
  //generate and download the lesson plan

  const handleDownloadSession = (session) => {
    const doc = new jsPDF();
  
    // Session-level Details (Display Once)
    doc.setFontSize(12);
    doc.text("Lesson Plan", 10, 10);
    doc.text(`Subject: Social Studies`, 10, 20);
    doc.text(`Class: ${className || "Unknown"}`, 10, 30);
    doc.text(`Unit: ${unitName || "Unknown"}`, 10, 40);
    doc.text(`Chapter: ${chapterName || "Unknown"}`, 10, 50);
    doc.text(`Session Type: Theory`, 10, 60);
    doc.text(`Session Number: ${session.sessionNumber}`, 10, 70);
    doc.text(`Duration: 45 minutes`, 10, 80);
  
    let yPosition = 90; // Start Position for Topics
  
    // Loop through Topics and Concepts
    session.Topics.forEach((topic, tIndex) => {
      if (yPosition > 270) {
        doc.addPage(); // Add new page if space runs out
        yPosition = 10; // Reset Y position
      }
      
      // Topic Name
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Topic: ${topic.topicName}`, 10, yPosition);
      yPosition += 10;
  
      // List Concepts under the Topic
      topic.Concepts.forEach((concept, cIndex) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 10;
        }
  
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`${cIndex + 1}. ${concept.concept}`, 15, yPosition);
        yPosition += 7;
      });
    });
  
    // Save PDF
    doc.save(`Session_${session.sessionNumber}_LessonPlan.pdf`);
  };

  
  
  // downloading all sessions as a single file
  const handleDownloadSessionPlans = () => {
    let downloadContent = `Chapter Name: ${chapterName}\nClass: ${className}\nSubject: Social\n\n`;
  
    // Iterate through all sessions and generate content
    sessionPlans.forEach((session) => {
      downloadContent += `=== Session ${session.sessionNumber} ===\n\n`;
  
      session.Topics.forEach((topic) => {
        downloadContent += `Topic: ${topic.topicName}\n\n`;
  
        topic.Concepts.forEach((concept, index) => {
          downloadContent += `- Concept ${index + 1}: ${concept.concept}\n`;
          downloadContent += `  Details: ${concept.conceptDetailing || "No Details"}\n`;
          downloadContent += `  Lesson Plan:\n${concept.LessonPlan?.generatedLP || "Not Generated"}\n\n`;
        });
  
        downloadContent += `-------------------------------------------------\n`;
      });
  
      downloadContent += `========================================\n\n`;
    });
  
    // Trigger file download
    const blob = new Blob([downloadContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Lesson_Plan_${chapterName || "Session"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <button
  onClick={handleDownloadSessionPlans}
  className="btn btn-success"
>
  Download All Session Plans
</button>


      <table>
  <thead>
    <tr>
      <th>Session Number</th>
      <th>Topic Name</th>
      <th>Concept</th>
      <th>Concept Detailing</th>
      <th>Lesson Plan</th>
    </tr>
  </thead>
  <tbody>
  {Array.isArray(sessionPlans) && sessionPlans.length > 0 ? (
    sessionPlans.map((plan) => (
      <React.Fragment key={plan.id}>
        {/* Download Button Row for the Session */}
        <tr>
  <td colSpan="5" style={{ textAlign: "left" }}>
    <strong>Session {plan.sessionNumber}</strong>
    <button
  onClick={() => handleDownloadSession(plan)}
  className="btn btn-success"
>
  Download PDF
</button>


  </td>
</tr>



        {/* Topics and Concepts Row */}
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
              <td>{concept.name || "No Concept"}</td>

              {/* Render Concept Detailing */}
              <td>{concept.detailing || "No Detailing"}</td>

              {/* Lesson Plan View Button */}
              <td>
                <button onClick={() => handleViewLessonPlan(concept.id)}>
                  View
                </button>
              </td>
            </tr>
          ))
        )}
      </React.Fragment>
    ))
  ) : (
    <tr>
      <td colSpan="5">No session plans available. Please upload or create a new one.</td>
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
    <pre>{lessonPlanContent}</pre>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Close
    </Button>
    </Modal.Footer>
</Modal>;
    </div>
  );
  
};  

export default SessionPlans;
