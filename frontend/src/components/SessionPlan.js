import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles.css';
 
const SessionPlans = () => {
  const { sessionId } = useParams();
  const [sessionPlans, setSessionPlans] = useState([]);
  const [numberOfSessions, setNumberOfSessions] = useState(0);
  const [topics, setTopics] = useState({});
  const [editing, setEditing] = useState({});
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploadDisabled, setUploadDisabled] = useState(false);

  useEffect(() => {
    const fetchSessionPlans = async () => {
      try {
        const sessionResponse = await axios.get(`http://localhost:5000/api/sessions/${sessionId}`);
        setNumberOfSessions(sessionResponse.data.numberOfSessions);

        const response = await axios.get(`http://localhost:5000/api/sessions/${sessionId}/sessionPlans`);
        console.log('Session Plans Response:', response.data);

        response.data.forEach(plan => {
          console.log(`Session Number: ${plan.sessionNumber}, Topics:`, plan.Topics);
        });

        setSessionPlans(response.data);

        const initialTopics = response.data.reduce((acc, plan) => {
          acc[plan.sessionNumber] = plan.Topics ? plan.Topics : [];
          return acc;
        }, {});
        console.log('Initial Topics:', initialTopics);
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
    setTopics(prevState => ({
      ...prevState,
      [sessionNumber]: prevState[sessionNumber].map((topic, i) =>
        i === index ? value : topic
      )
    }));
  };

  const handleAddTopic = (sessionNumber, order) => {
    const newTopic = "";
    setTopics(prevState => {
      const updatedTopics = [...(prevState[sessionNumber] || [])];
      updatedTopics.splice(order, 0, newTopic);
      return {
        ...prevState,
        [sessionNumber]: updatedTopics,
      };
    });
    setEditing(prevEditing => ({
      ...prevEditing,
      [sessionNumber]: true
    }));
  };

  const handleDeleteTopic = (sessionNumber, index) => {
    setTopics(prevState => ({
      ...prevState,
      [sessionNumber]: prevState[sessionNumber].filter((_, i) => i !== index)
    }));
  };

  const handleSaveTopic = async (sessionPlanId, sessionNumber) => {
    try {
      const planDetails = JSON.stringify(topics[sessionNumber]);
      const response = await axios.put(`http://localhost:5000/api/sessionPlans/${sessionPlanId}`, { planDetails });
      console.log('Response:', response.data);
      setSessionPlans(prevState => {
        const newState = prevState.map(plan => {
          if (plan.id === sessionPlanId) {
            return { ...plan, Topics: topics[sessionNumber], planDetails };
          }
          return plan;
        });
        return newState;
      });
      setEditing(prevEditing => ({ ...prevEditing, [sessionNumber]: false }));
    } catch (error) {
      console.error('Error saving topic:', error);
    }
  };

  const handleDeleteSessionPlan = async (planId) => {
    try {
      await axios.delete(`http://localhost:5000/api/sessionPlans/${planId}`);
      setSessionPlans(sessionPlans.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  const handleDeleteAllSessionPlans = async () => {
    if (window.confirm('Are you sure you want to delete all session plans?')) {
      try {
        await axios.delete(`http://localhost:5000/api/sessions/${sessionId}/sessionPlans`);
        setSessionPlans([]);
        setTopics({});
        setUploadDisabled(false);
      } catch (error) {
        console.error('Error deleting all session plans:', error);
      }
    }
  };

  const startEditing = (sessionNumber) => {
    setEditing(prevEditing => ({ ...prevEditing, [sessionNumber]: true }));
  };

  const cancelEditing = (sessionNumber) => {
    setEditing(prevEditing => ({ ...prevEditing, [sessionNumber]: false }));
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
      await axios.post(`http://localhost:5000/api/sessions/${sessionId}/sessionPlans/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setFile(null);
      const response = await axios.get(`http://localhost:5000/api/sessions/${sessionId}/sessionPlans`);
      console.log('Uploaded Session Plans:', response.data);
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
            {[...Array(numberOfSessions)].map((_, index) => {
              const sessionNumber = index + 1;
              const existingPlan = sessionPlans.find(plan => plan.sessionNumber === sessionNumber);
              const topicsForSession = Array.isArray(topics[sessionNumber]) ? topics[sessionNumber] : [];

              return (
                <React.Fragment key={sessionNumber}>
                  <tr>
                    <td>{sessionNumber}</td>
                    <td>
                      {topicsForSession.map((topic, i) => (
                        <div key={i} className="topic-input">
                          <input
                            type="text"
                            value={topic}
                            onChange={(e) => handleInputChange(sessionNumber, i, e.target.value)}
                            disabled={!editing[sessionNumber]}
                          />
                          {editing[sessionNumber] && (
                            <button onClick={() => handleDeleteTopic(sessionNumber, i)}>-</button>
                          )}
                        </div>
                      ))}
                    </td>
                    <td>
                      {editing[sessionNumber] ? (
                        <>
                          <button onClick={() => handleSaveTopic(existingPlan ? existingPlan.id : null, sessionNumber)}>Save</button>
                          <button onClick={() => cancelEditing(sessionNumber)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(sessionNumber)}>Edit</button>
                        </>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3">
                      <button onClick={() => handleAddTopic(sessionNumber, topicsForSession.length)}>+</button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionPlans;
