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
      [sessionNumber]: [...(prev[sessionNumber] || []), { name: "", concepts: [] }],
    }));
  };

  // Add a new concept to a specific topic
  const handleAddConcept = (sessionNumber, topicIndex) => {
    setTopicsWithConcepts((prev) => {
      const updatedTopics = prev[sessionNumber].map((topic, index) => {
        if (index === topicIndex) {
          return {
            ...topic,
            concepts: [...topic.concepts, ""],
          };
        }
        return topic;
      });
      return {
        ...prev,
        [sessionNumber]: updatedTopics,
      };
    });
  };

  // Handle topic name change
  const handleChangeTopic = (sessionNumber, topicIndex, value) => {
    setTopicsWithConcepts((prev) => {
      const updatedTopics = prev[sessionNumber].map((topic, index) =>
        index === topicIndex ? { ...topic, name: value } : topic
      );
      return {
        ...prev,
        [sessionNumber]: updatedTopics,
      };
    });
  };

  // Handle concept name change
  const handleChangeConcept = (sessionNumber, topicIndex, conceptIndex, value) => {
    setTopicsWithConcepts((prev) => {
      const updatedTopics = prev[sessionNumber].map((topic, index) => {
        if (index === topicIndex) {
          const updatedConcepts = topic.concepts.map((concept, cIndex) =>
            cIndex === conceptIndex ? value : concept
          );
          return { ...topic, concepts: updatedConcepts };
        }
        return topic;
      });
      return {
        ...prev,
        [sessionNumber]: updatedTopics,
      };
    });
  };

  // Save session plan
  const handleSaveSessionPlan = async (sessionPlanId, sessionNumber) => {
    try {
      setSaving(true);
      const planDetails = topicsWithConcepts[sessionNumber].map((topic) => ({
        name: topic.name,
        concepts: topic.concepts,
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

  // Handle file change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload session plans via Excel
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

  return (
    <div className="container">
      <h2 className="header">Session Plans</h2>
      {board && <p>Board: {board}</p>}
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleFileUpload} className="form-group">
        <label>Upload Session Plans via Excel:</label>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          disabled={uploadDisabled}
        />
        <button type="submit" disabled={uploadDisabled}>
          Upload
        </button>
      </form>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Session Number</th>
              <th>Topic Names</th>
              <th>Related Concepts</th>
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
                    <td>
                      <input
                        type="text"
                        value={topic.name}
                        onChange={(e) =>
                          handleChangeTopic(plan.sessionNumber, tIndex, e.target.value)
                        }
                      />
                      <button onClick={() => handleAddConcept(plan.sessionNumber, tIndex)}>
                        + Add Concept
                      </button>
                    </td>
                    <td>
                      {topic.concepts.map((concept, cIndex) => (
                        <input
                          key={cIndex}
                          type="text"
                          value={concept}
                          onChange={(e) =>
                            handleChangeConcept(plan.sessionNumber, tIndex, cIndex, e.target.value)
                          }
                        />
                      ))}
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
                  <td colSpan="4">
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
