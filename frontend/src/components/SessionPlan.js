import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";
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
  const [showARModal, setShowARModal] = useState(false); // Modal for A and R
  const [arType, setARType] = useState(""); // Type: pre-learning or post-learning
  const [arTopicName, setARTopicName] = useState(""); // Topic Name
  const [arConceptName, setARConceptName] = useState(""); // Concept Name
  const [arOrder, setAROrder] = useState(1); // Order for post-learning
  const [arSaving, setARSaving] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [existingTopics, setExistingTopics] = useState([]); // Store existing topics
  const [selectedTopic, setSelectedTopic] = useState(""); // Store the selected topic
  const [selectedConcepts, setSelectedConcepts] = useState([]); // Store selected concepts
  const [arConcepts, setARConcepts] = useState([{ name: "", detailing: "" }]);

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
  
// A & R starts
// Function to handle opening the modal
const handleOpenARModal = async (type) => {
  console.log('Opening Modal:', type);
  setShowARModal(true);
  setARType(type);

  if (type === 'post-learning') {
    try {
      const response = await axios.get(`/api/sessions/${sessionId}/existingTopics`);
      console.log('Fetched Topics:', response.data);
      setExistingTopics(response.data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching existing topics:', error);
      setError('Failed to fetch existing topics for post-learning.');
    }
  }
};



// Save Action and Recommendation
const handleSaveAR = async (topicId, concepts) => {
  const payload = {
    type: arType,
    topicName: arTopicName, // For pre-learning
    conceptDetails: concepts, // For pre-learning (multiple concepts)
    topicId, // For post-learning
    conceptIds: selectedConcepts, // For post-learning
  };

  try {
    const response = await axios.post(
      `/api/sessions/${sessionId}/actionsAndRecommendations`,
      payload
    );

    // Fetch updated session plans
    fetchSessionPlans();

    setSuccessMessage("Action/Recommendation added successfully!");
    setShowARModal(false);
    setARTopicName(""); // Reset topic name
    setARConcepts([{ name: "", detailing: "" }]); // Reset concepts
    setError("");
  } catch (error) {
    console.error("Error saving action/recommendation:", error);
    setError("Failed to save action/recommendation. Please try again.");
  }
};






// Function to generate lesson plan for A and R
const handleGenerateARLessonPlan = async (arId) => {
  try {
    const response = await axios.post(
      `https://tms.up.school/api/sessionPlans/${sessionId}/actionsAndRecommendations/${arId}/generateLessonPlan`,
      {
        board,
        grade: className,
        subject: subjectName,
        unit: unitName,
      }
    );
    setSuccessMessage("Lesson plan generated successfully!");
    setError("");
  } catch (error) {
    console.error("Error generating lesson plan for A and R:", error);
    setError("Failed to generate lesson plan for A and R.");
  }
};

// Modal for Adding A and R Topics
{/* A and R Modal */}
<Modal show={showARModal} onHide={() => setShowARModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>
      {arType === "pre-learning" ? "Add Pre-learning" : "Add Post-learning"}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      {arType === "pre-learning" && (
        <>
          {/* Topic Name */}
          <Form.Group>
            <Form.Label>Topic Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter topic name"
              value={arTopicName}
              onChange={(e) => setARTopicName(e.target.value)}
            />
          </Form.Group>

          {/* Concepts */}
          {arConcepts.map((concept, index) => (
            <div key={index} className="concept-row">
              <Form.Group>
                <Form.Label>Concept Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={`Enter concept ${index + 1} name`}
                  value={concept.name}
                  onChange={(e) => {
                    const updatedConcepts = [...arConcepts];
                    updatedConcepts[index].name = e.target.value;
                    setARConcepts(updatedConcepts);
                  }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Concept Details</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={`Enter details for concept ${index + 1}`}
                  value={concept.detailing}
                  onChange={(e) => {
                    const updatedConcepts = [...arConcepts];
                    updatedConcepts[index].detailing = e.target.value;
                    setARConcepts(updatedConcepts);
                  }}
                />
              </Form.Group>

              {/* Remove Concept Button */}
              <Button
                variant="danger"
                onClick={() => {
                  const updatedConcepts = arConcepts.filter((_, i) => i !== index);
                  setARConcepts(updatedConcepts);
                }}
                className="btn-sm"
              >
                Remove Concept
              </Button>
            </div>
          ))}

          {/* Add More Concepts Button */}
          <Button
            variant="secondary"
            onClick={() => setARConcepts([...arConcepts, { name: "", detailing: "" }])}
          >
            + Add More Concepts
          </Button>
        </>
      )}

      {/* For Post-learning */}
      {arType === "post-learning" && (
        <>
          <Form.Group>
            <Form.Label>Select Topic</Form.Label>
            <Form.Control
              as="select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="">Choose a topic</option>
              {existingTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Select Concepts</Form.Label>
            {existingTopics
              .find((topic) => topic.id === selectedTopic)
              ?.concepts.map((concept) => (
                <Form.Check
                  key={concept.id}
                  type="checkbox"
                  label={concept.name}
                  value={concept.id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedConcepts((prev) =>
                      prev.includes(value)
                        ? prev.filter((id) => id !== value)
                        : [...prev, value]
                    );
                  }}
                />
              ))}
          </Form.Group>
        </>
      )}
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowARModal(false)}>
      Close
    </Button>
    <Button
      variant="primary"
      onClick={() =>
        arType === "pre-learning"
          ? handleSaveAR(null, arConcepts) // Save pre-learning with concepts
          : handleSaveAR(selectedTopic, selectedConcepts) // Save post-learning with selected concepts
      }
    >
      Save
    </Button>
  </Modal.Footer>
</Modal>






// A & R ends


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


  const handleDownloadSession = (sessionNumber) => {
    const session = sessionPlans.find((plan) => plan.sessionNumber === sessionNumber);
  
    if (!session) {
      console.error(`Session ${sessionNumber} not found.`);
      return;
    }
  
    // Initialize jsPDF
    const doc = new jsPDF();
    const lineHeight = 6; // Vertical spacing between lines
    const boxPadding = 2; // Padding for content in the boxes
    const pageHeight = doc.internal.pageSize.height - 20; // Page height with margin
    let y = 20; // Starting vertical position

    // Add a consistent header to all pages
  const addHeader = () => {
    doc.setFontSize(10);
    doc.text(`Class ${className} ${subjectName} Lesson Plan`, 10, 10, { align: "left" });
    doc.line(10, 12, 200, 12); // Horizontal line below the header
  };

  // Add the header to the first page
  addHeader();

  // Add first-page heading
  doc.setFontSize(10);
  doc.text(`Unit Name: ${unitName || "N/A"}`, 10, y);
  y += lineHeight;
  doc.text(`Chapter Name: ${chapterName || "N/A"}`, 10, y);
  y += lineHeight * 2;
  doc.text(`Session Type: Theory`, 10, y);
  y += lineHeight;
  doc.text(`Number of Sessions: 1`, 10, y);
  y += lineHeight;
  doc.text(`Duration per Session: 45 minutes`, 10, y);
  y += lineHeight * 2;
  
    // Add topics and concepts
    session.Topics.forEach((topic) => {
      // Add topic title
      if (y > pageHeight) {
        doc.addPage();
        y = 10; // Reset y position for the new page
      }
  
      doc.setFont("helvetica", "bold");
      doc.text(`Topic: ${topic.topicName}`, 10, y);
      y += lineHeight * 1.5;
  
      topic.Concepts.forEach((concept, index) => {
        if (y > pageHeight) {
          doc.addPage();
          y = 10;
        }
  
        // Add concept name
        doc.setFont("helvetica", "normal");
        doc.text(`Concept ${index + 1}: ${concept.concept}`, 10, y);
        y += lineHeight;
  
        // Add concept detailing
        if (concept.conceptDetailing) {
          const details = doc.splitTextToSize(`Details: ${concept.conceptDetailing}`, 180); // Wrap text
          details.forEach((line) => {
            if (y > pageHeight) {
              doc.addPage();
              y = 10;
            }
            doc.text(line, 10, y);
            y += lineHeight;
          });
        }
  
        // Add lesson plan without timings
        if (concept.LessonPlan?.generatedLP) {
          const filteredLessonPlan = concept.LessonPlan.generatedLP.replace(/\(\d+ minutes\)/g, "");
          const lessonPlanLines = doc.splitTextToSize(`Lesson Plan:\n${filteredLessonPlan}`, 180);
  
          lessonPlanLines.forEach((line) => {
            if (y > pageHeight) {
              doc.addPage();
              y = 10;
            }
            doc.text(line, 10, y);
            y += lineHeight;
          });
        }
  
        y += lineHeight; // Add spacing after each concept
      });
  
      y += lineHeight; // Add spacing after each topic
    });
  
    // Save the PDF file
    doc.save(`Session_${sessionNumber}_LessonPlan.pdf`);
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
  
      {/* Actions and Recommendations Controls */}
      <div className="ar-controls">
        <Button onClick={() => handleOpenARModal("pre-learning")} className="btn btn-primary">
          Add Pre-learning
        </Button>
        <Button onClick={() => handleOpenARModal("post-learning")} className="btn btn-primary">
          Add Post-learning
        </Button>
      </div>
  
      {/* Info Banner */}
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
          <strong>Board:</strong> {board}
        </p>
        <p>
          <strong>Chapter Name:</strong> {chapterName} | <strong>Unit Name:</strong> {unitName}
        </p>
      </div>
  
      {/* Success and Error Messages */}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}
  
      {/* File Upload Section */}
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
  
      {/* Generate Lesson Plans Button */}
      <div className="generate-controls">
        <button onClick={handleGenerateAllLessonPlans} disabled={saving}>
          {saving ? "Generating..." : "Generate All Lesson Plans"}
        </button>
      </div>
  
      {/* Session Plans Table */}
      <div className="table-container">
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
              sessionPlans.flatMap((plan, planIndex) => {
                const preLearningTopics =
                  plan.ActionsAndRecommendations?.filter((ar) => ar.type === "pre-learning") || [];
                const postLearningTopics =
                  plan.ActionsAndRecommendations?.filter((ar) => ar.type === "post-learning") || [];
  
                const preLearningRows = preLearningTopics.map((ar, arIndex) => (
                  <tr key={`pre-${plan.id}-${arIndex}`}>
                    <td>{planIndex === 0 && arIndex === 0 ? "Pre-learning" : ""}</td>
                    <td>{ar.topicName || "No Topic Name"}</td>
                    <td>{ar.conceptName || "No Concept Name"}</td>
                    <td>N/A</td>
                    <td>
                      <button onClick={() => handleGenerateARLessonPlan(ar.id)}>Generate</button>
                    </td>
                  </tr>
                ));
  
                const sessionRows =
                  topicsWithConcepts[plan.sessionNumber]?.flatMap((topic, tIndex) =>
                    topic.concepts.map((concept, cIndex) => (
                      <tr key={`${plan.id}-${tIndex}-${cIndex}`}>
                        {tIndex === 0 && cIndex === 0 && (
                          <td
                            rowSpan={topicsWithConcepts[plan.sessionNumber].reduce(
                              (acc, t) => acc + t.concepts.length,
                              0
                            )}
                          >
                            {plan.sessionNumber}
                          </td>
                        )}
                        {cIndex === 0 && (
                          <td rowSpan={topic.concepts.length}>{topic.name || "No Topic Name"}</td>
                        )}
                        <td>{concept.name || "No Concept"}</td>
                        <td>{concept.detailing || "No Detailing"}</td>
                        <td>
                          <button onClick={() => handleViewLessonPlan(concept.id)}>View</button>
                        </td>
                      </tr>
                    ))
                  ) || [];
  
                const postLearningRows = postLearningTopics.map((ar, arIndex) => (
                  <tr key={`post-${plan.id}-${arIndex}`}>
                    <td>Post-learning</td>
                    <td>{ar.topicName || "No Topic Name"}</td>
                    <td>{ar.conceptName || "No Concept Name"}</td>
                    <td>N/A</td>
                    <td>
                      <button onClick={() => handleGenerateARLessonPlan(ar.id)}>Generate</button>
                    </td>
                  </tr>
                ));
  
                return [
                  ...preLearningRows,
                  <React.Fragment key={`session-${plan.id}`}>
                    <tr>
                      <td colSpan="5" style={{ textAlign: "left" }}>
                        <strong>Session {plan.sessionNumber}</strong>
                        <button
                          onClick={() => handleDownloadSession(plan.sessionNumber)}
                          className="btn btn-primary"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                    {sessionRows}
                  </React.Fragment>,
                  ...postLearningRows,
                ];
              })
            ) : (
              <tr>
                <td colSpan="5">No session plans available. Please upload or create a new one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
  
      {/* A and R Modal */}
      <Modal show={showARModal} onHide={() => setShowARModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>{arType === "pre-learning" ? "Add Pre-learning" : "Add Post-learning"}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      {arType === "pre-learning" && (
        <>
          <Form.Group>
            <Form.Label>Topic Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter topic name"
              value={arTopicName}
              onChange={(e) => setARTopicName(e.target.value)}
            />
          </Form.Group>

          {arConcepts.map((concept, index) => (
            <div key={index} className="concept-row">
              <Form.Group>
                <Form.Label>{`Concept Name ${index + 1}`}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={`Enter concept ${index + 1}`}
                  value={concept.name}
                  onChange={(e) => {
                    const updatedConcepts = [...arConcepts];
                    updatedConcepts[index].name = e.target.value;
                    setARConcepts(updatedConcepts);
                  }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Concept Details</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={`Enter details for concept ${index + 1}`}
                  value={concept.detailing}
                  onChange={(e) => {
                    const updatedConcepts = [...arConcepts];
                    updatedConcepts[index].detailing = e.target.value;
                    setARConcepts(updatedConcepts);
                  }}
                />
              </Form.Group>
              {index === arConcepts.length - 1 && (
                <Button
                  variant="success"
                  className="mt-2"
                  onClick={() => setARConcepts([...arConcepts, { name: "", detailing: "" }])}
                >
                  + Add Concept
                </Button>
              )}
            </div>
          ))}
        </>
      )}
      {arType === "post-learning" && (
        <>
          <Form.Group>
            <Form.Label>Select Topic</Form.Label>
            <Form.Control
              as="select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="">Choose a topic</option>
              {existingTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Select Concepts</Form.Label>
            {existingTopics
              .find((topic) => topic.id === selectedTopic)
              ?.concepts.map((concept) => (
                <Form.Check
                  key={concept.id}
                  type="checkbox"
                  label={concept.name}
                  value={concept.id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedConcepts((prev) =>
                      prev.includes(value)
                        ? prev.filter((id) => id !== value)
                        : [...prev, value]
                    );
                  }}
                />
              ))}
          </Form.Group>
        </>
      )}
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowARModal(false)}>
      Close
    </Button>
    <Button
      variant="primary"
      onClick={() =>
        arType === "pre-learning"
          ? handleSaveAR(null, arConcepts)
          : handleSaveAR(selectedTopic, selectedConcepts)
      }
    >
      Save
    </Button>
  </Modal.Footer>
</Modal>

    </div>
  );
  
}; 

export default SessionPlans;
