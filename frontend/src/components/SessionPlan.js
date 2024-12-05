import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom'; // Added useLocation to capture query parameters
import '../styles.css';

const SessionPlans = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const [board, setBoard] = useState('');
  const [sessionPlans, setSessionPlans] = useState([]);
  const [topics, setTopics] = useState({});
  const [editing, setEditing] = useState({});
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploadDisabled, setUploadDisabled] = useState(false);

  // Extract board from query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const boardParam = queryParams.get('board');
    setBoard(boardParam || ''); // Set board if available, else keep it empty
  }, [location]);

  useEffect(() => {
    const fetchSessionPlans = async () => {
      try {
        const response = await axios.get(`https://tms.up.school/api/sessions/${sessionId}/sessionPlans`);
        setSessionPlans(response.data);

        const initialTopics = response.data.reduce((acc, plan) => {
          acc[plan.sessionNumber] = plan.planDetails || [];
          return acc;
        }, {});
        setTopics(initialTopics);

        if (response.data.length > 0) {
          setUploadDisabled(true);
        }
      } catch (error) {
        console.error('Error fetching session plans:', error);
        setError('Failed to fetch session plans.');
      }
    };

    fetchSessionPlans();
  }, [sessionId]);

  const handleInputChange = (sessionNumber, index, value) => {
    setTopics((prevState) => ({
      ...prevState,
      [sessionNumber]: prevState[sessionNumber].map((topic, i) =>
        i === index ? value : topic
      ),
    }));
  };

  const handleAddTopic = (sessionNumber) => {
    setTopics((prevState) => {
      const updatedTopics = [...(prevState[sessionNumber] || []), ''];
      return {
        ...prevState,
        [sessionNumber]: updatedTopics,
      };
    });
    setEditing((prevEditing) => ({
      ...prevEditing,
      [sessionNumber]: true,
    }));
  };

  const handleDeleteTopic = (sessionNumber, index) => {
    setTopics((prevState) => ({
      ...prevState,
      [sessionNumber]: prevState[sessionNumber].filter((_, i) => i !== index),
    }));
  };

  const handleSaveTopic = async (sessionPlanId, sessionNumber) => {
    try {
      const planDetails = JSON.stringify(topics[sessionNumber]);
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

  const handleDeleteAllSessionPlans = async () => {
    if (window.confirm('Are you sure you want to delete all session plans?')) {
      try {
        await axios.delete(`https://tms.up.school/api/sessions/${sessionId}/sessionPlans`);
        setSessionPlans([]);
        setTopics({});
        setUploadDisabled(false);
      } catch (error) {
        console.error('Error deleting all session plans:', error);
      }
    }
  };

  const startEditing = (sessionNumber) => {
    setEditing((prevEditing) => ({ ...prevEditing, [sessionNumber]: true }));
  };

  const cancelEditing = (sessionNumber) => {
    setEditing((prevEditing) => ({ ...prevEditing, [sessionNumber]: false }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
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
      await axios.post(`https://tms.up.school/api/sessions/${sessionId}/sessionPlans/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFile(null);
      const response = await axios.get(`https://tms.up.school/api/sessions/${sessionId}/sessionPlans`);
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
      {board && <p>Board: {board}</p>} {/* Display the board */}
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleFileUpload} className="form-group">
        <label>Upload Session Plans via Excel:</label>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} disabled={uploadDisabled} />
        <button type="submit" disabled={uploadDisabled}>Upload</button>
      </form>
      <div className="buttons">
        <button onClick={handleDeleteAllSessionPlans}>Delete All</button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Session Number</th>
              <th>Topic Names</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessionPlans.map((plan) => (
              <React.Fragment key={plan.id}>
                <tr>
                  <td>{plan.sessionNumber}</td>
                  <td>
                    {topics[plan.sessionNumber]?.map((topic, i) => (
                      <div key={i} className="topic-input">
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => handleInputChange(plan.sessionNumber, i, e.target.value)}
                          disabled={!editing[plan.sessionNumber]}
                        />
                        {editing[plan.sessionNumber] && (
                          <button onClick={() => handleDeleteTopic(plan.sessionNumber, i)}>-</button>
                        )}
                      </div>
                    ))}
                  </td>
                  <td>
                    {editing[plan.sessionNumber] ? (
                      <>
                        <button onClick={() => handleSaveTopic(plan.id, plan.sessionNumber)}>Save</button>
                        <button onClick={() => cancelEditing(plan.sessionNumber)}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => startEditing(plan.sessionNumber)}>Edit</button>
                    )}
                  </td>
                </tr>
                <tr>
                  <td colSpan="3">
                    <button onClick={() => handleAddTopic(plan.sessionNumber)}>+</button>
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
