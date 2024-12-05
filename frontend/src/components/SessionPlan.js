import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';
import '../styles.css';

const SessionPlans = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const [board, setBoard] = useState('');
  const [sessionPlans, setSessionPlans] = useState([]);
  const [topicsWithConcepts, setTopicsWithConcepts] = useState({});
  const [editing, setEditing] = useState({});
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploadDisabled, setUploadDisabled] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const boardParam = queryParams.get('board');
    setBoard(boardParam || '');
  }, [location]);

  useEffect(() => {
    const fetchSessionPlans = async () => {
      try {
        const response = await axios.get(`https://tms.up.school/api/sessions/${sessionId}/sessionPlans?board=${board}`);
        setSessionPlans(response.data);

        const initialTopics = response.data.reduce((acc, plan) => {
          acc[plan.sessionNumber] = plan.planDetails.map((detail) => ({
            topic: detail.topic,
            concepts: detail.concepts || [],
          }));
          return acc;
        }, {});
        setTopicsWithConcepts(initialTopics);

        if (response.data.length > 0) {
          setUploadDisabled(true);
        }
      } catch (error) {
        console.error('Error fetching session plans:', error);
        setError('Failed to fetch session plans.');
      }
    };

    fetchSessionPlans();
  }, [sessionId, board]);

  const handleAddConcept = (sessionNumber, topicIndex) => {
    setTopicsWithConcepts((prevState) => {
      const updatedConcepts = [...prevState[sessionNumber][topicIndex].concepts, ''];
      prevState[sessionNumber][topicIndex].concepts = updatedConcepts;
      return { ...prevState };
    });
  };

  const handleConceptChange = (sessionNumber, topicIndex, conceptIndex, value) => {
    setTopicsWithConcepts((prevState) => {
      prevState[sessionNumber][topicIndex].concepts[conceptIndex] = value;
      return { ...prevState };
    });
  };

  const handleSaveTopic = async (sessionPlanId, sessionNumber) => {
    try {
      const planDetails = JSON.stringify(
        topicsWithConcepts[sessionNumber].map((item) => ({
          topic: item.topic,
          concepts: item.concepts,
        }))
      );
      await axios.put(`https://tms.up.school/api/sessionPlans/${sessionPlanId}`, { planDetails });

      setSessionPlans((prevState) =>
        prevState.map((plan) => {
          if (plan.id === sessionPlanId) {
            return { ...plan, planDetails: JSON.parse(planDetails) };
          }
          return plan;
        })
      );

      setEditing((prevEditing) => ({ ...prevEditing, [sessionNumber]: false }));
    } catch (error) {
      console.error('Error saving topic:', error);
      setError('Failed to save topic. Please try again.');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`https://tms.up.school/api/sessions/${sessionId}/sessionPlans/upload?board=${board}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFile(null);
      const response = await axios.get(`https://tms.up.school/api/sessions/${sessionId}/sessionPlans?board=${board}`);
      setSessionPlans(response.data);
      setUploadDisabled(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response && error.response.data) {
        setError(error.response.data.message);
      }
    }
  };

  return (
    <div className="container">
      <h2 className="header">Session Plans</h2>
      {board && <p>Board: {board}</p>}
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleFileUpload} className="form-group">
        <label>Upload Session Plans via Excel:</label>
        <input type="file" accept=".xlsx, .xls" onChange={(e) => setFile(e.target.files[0])} disabled={uploadDisabled} />
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
                <tr>
                  <td>{plan.sessionNumber}</td>
                  <td>
                    {topicsWithConcepts[plan.sessionNumber]?.map((item, topicIndex) => (
                      <div key={topicIndex}>
                        <strong>{item.topic}</strong>
                        {item.concepts.map((concept, conceptIndex) => (
                          <div key={conceptIndex}>
                            <input
                              type="text"
                              value={concept}
                              onChange={(e) =>
                                handleConceptChange(plan.sessionNumber, topicIndex, conceptIndex, e.target.value)
                              }
                            />
                          </div>
                        ))}
                        <button onClick={() => handleAddConcept(plan.sessionNumber, topicIndex)}>+ Add Concept</button>
                      </div>
                    ))}
                  </td>
                  <td>
                    <button onClick={() => console.log(`View Lesson Plan for session ${plan.sessionNumber}`)}>
                      View Lesson Plan
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleSaveTopic(plan.id, plan.sessionNumber)}>Save</button>
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
