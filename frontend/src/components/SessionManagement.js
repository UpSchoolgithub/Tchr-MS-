import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

const SessionManagement = () => {
  const { schoolId, classId, sectionId, subjectId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingNumberOfSessions, setEditingNumberOfSessions] = useState("");
  const [editingPriorityNumber, setEditingPriorityNumber] = useState("");
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newTopic, setNewTopic] = useState("");
  const [newConcepts, setNewConcepts] = useState("");

  // Fetch sessions for the given school, class, section, and subject
  const fetchSessions = async () => {
    setIsLoading(true);
    setError("");
    try {
      const url = `https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}/sessions`;
      const response = await axios.get(url);
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Failed to fetch sessions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [schoolId, classId, sectionId, subjectId]);

  const startEditing = (session) => {
    setEditingSessionId(session.id);
    setEditingNumberOfSessions(session.numberOfSessions);
    setEditingPriorityNumber(session.priorityNumber);
  };

  const handleSessionUpdate = async (sessionId) => {
    try {
      await axios.put(
        `/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}`,
        {
          numberOfSessions: editingNumberOfSessions,
          priorityNumber: editingPriorityNumber,
        }
      );
      setEditingSessionId(null);
      fetchSessions();
    } catch (error) {
      console.error("Error updating session:", error);
      setError("Failed to update session. Please check your input and try again.");
    }
  };

  const handleAddTopic = async (sessionId) => {
    if (!newTopic.trim()) {
      setError("Topic name cannot be empty.");
      return;
    }
    const conceptsArray = newConcepts.split(",").map((concept) => concept.trim());

    try {
      await axios.post(
        `/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/sessions/${sessionId}/addTopic`,
        {
          topic: newTopic,
          concepts: conceptsArray,
        }
      );
      setNewTopic("");
      setNewConcepts("");
      fetchSessions();
    } catch (error) {
      console.error("Error adding topic:", error);
      setError("Failed to add the topic. Please try again.");
    }
  };

  const handleViewLessonPlan = async (session) => {
    try {
      const payload = {
        board: session.board,
        grade: session.grade,
        subject: session.subject,
        subSubject: session.subSubject || "N/A",
        unit: session.unit || "N/A",
        chapter: session.chapterName,
        topics: session.topics.map((topic) => ({
          topic: topic.name,
          concepts: topic.concepts,
        })),
        sessionType: session.sessionType || "Theory",
        noOfSession: 1,
        duration: 45,
      };

      const response = await axios.post(
        `https://tms.up.school/api/dynamicLP`,
        payload
      );

      const lessonPlan = response.data.lesson_plan;

      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === session.id ? { ...s, lessonPlan } : s
        )
      );

      setSelectedLessonPlan(lessonPlan);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      setError("Failed to fetch the lesson plan. Please try again.");
    }
  };

  const closeLessonPlanModal = () => {
    setSelectedLessonPlan("");
    setIsModalOpen(false);
  };

  return (
    <div>
      <h2>Session Management</h2>
      {error && <div className="error">{error}</div>}
      {isLoading && <p>Loading...</p>}

      <form onSubmit={handleFileUpload}>
        <input type="file" name="file" accept=".xlsx, .xls" required />
        <button type="submit">Upload</button>
      </form>

      <button onClick={handleBulkDelete} disabled={selectedSessionIds.length === 0}>
        Bulk Delete
      </button>

      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={(e) =>
                  setSelectedSessionIds(
                    e.target.checked ? sessions.map((session) => session.id) : []
                  )
                }
                checked={
                  selectedSessionIds.length === sessions.length && sessions.length > 0
                }
              />
            </th>
            <th>Unit Name</th>
            <th>Chapter</th>
            <th>Number of Sessions</th>
            <th>Priority Number</th>
            <th>Lesson Plan</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>
                <input
                  type="checkbox"
                  checked={isSelected(session.id)}
                  onChange={() => toggleSelection(session.id)}
                />
              </td>
              <td>{session.unitName || "N/A"}</td>
              <td>{session.chapterName || "N/A"}</td>
              <td>
                {editingSessionId === session.id ? (
                  <input
                    type="number"
                    value={editingNumberOfSessions}
                    onChange={(e) => setEditingNumberOfSessions(e.target.value)}
                  />
                ) : (
                  session.numberOfSessions
                )}
              </td>
              <td>
                {editingSessionId === session.id ? (
                  <input
                    type="number"
                    value={editingPriorityNumber}
                    onChange={(e) => setEditingPriorityNumber(e.target.value)}
                  />
                ) : (
                  session.priorityNumber
                )}
              </td>
              <td>
                {session.lessonPlan ? (
                  <button onClick={() => setSelectedLessonPlan(session.lessonPlan)}>
                    View
                  </button>
                ) : (
                  <button onClick={() => handleViewLessonPlan(session)}>Generate</button>
                )}
              </td>
              <td>
                {editingSessionId === session.id ? (
                  <>
                    <button onClick={() => handleSessionUpdate(session.id)}>Save</button>
                    <button onClick={() => setEditingSessionId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditing(session)}>Edit</button>
                    <button onClick={() => handleSessionDelete(session.id)}>Delete</button>
                    <Link to={`/sessions/${session.id}/sessionPlans`}>
                      <button>Session Plan</button>
                    </Link>
                    <div>
                      <input
                        type="text"
                        placeholder="Add Topic"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Add Concepts (comma-separated)"
                        value={newConcepts}
                        onChange={(e) => setNewConcepts(e.target.value)}
                      />
                      <button onClick={() => handleAddTopic(session.id)}>
                        Add Topic
                      </button>
                    </div>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Lesson Plan</h3>
            <pre>{selectedLessonPlan}</pre>
            <button onClick={closeLessonPlanModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
