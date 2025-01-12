async function callGPTAPI(payload) {
    try {
      const response = await axios.post('http://localhost:8000/generate-lesson-plan', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer YOUR_API_KEY`, // Replace with your actual key if needed
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error calling GPT API:', error.message);
      throw new Error('Failed to call GPT API');
    }
  }
  
  router.post('/api/generate-prelearning-lesson-plan', async (req, res) => {
    const { sessionId } = req.params;
    const { selectedTopics, board, grade, subject, unit, chapter } = req.body;
  
    if (!selectedTopics || selectedTopics.length === 0) {
      return res.status(400).json({ message: "No topics selected." });
    }
  
    try {
      // **Step 1:** Fetch topics and concepts from DB
      const topicsData = await Promise.all(
        selectedTopics.map(async (item) => {
          const action = await ActionsAndRecommendations.findOne({
            where: { id: item.id },
            attributes: ['id', 'sessionId', 'type', 'topicName', 'conceptName', 'conceptDetailing'],
          });
  
          if (!action) {
            throw new Error(`Action with ID ${item.id} not found.`);
          }
  
          return {
            topic: action.topicName,
            concepts: action.conceptName ? action.conceptName.split(",") : [],
            conceptDetails: action.conceptDetailing ? action.conceptDetailing.split(",") : [],
          };
        })
      );
  
      // **Step 2:** Prepare payload for the Python API
      const payloadForPythonAPI = {
        board: board || "Default Board",
        grade: grade || "Default Grade",
        subject: subject || "Default Subject",
        unit: unit || "Default Unit",
        chapter: chapter || "Default Chapter",
        topics: topicsData,
      };
  
      console.log("Sending Payload to Python API:", JSON.stringify(payloadForPythonAPI, null, 2));
  
      // **Step 3:** Call Python `/generate-prelearning-plan` service
      const pythonResponse = await axios.post('http://localhost:8000/generate-prelearning-plan', payloadForPythonAPI);
  
      const lessonPlanData = pythonResponse.data.lesson_plan; // Extract lesson plans
  
      if (!lessonPlanData || Object.keys(lessonPlanData).length === 0) {
        return res.status(500).json({ message: "No lesson plans generated." });
      }
  
      // **Step 4:** Send final response to the client
      res.status(200).json({
        message: "Pre-learning lesson plan generated successfully.",
        lessonPlan: lessonPlanData, // Session-wise lesson plans
      });
  
    } catch (error) {
      console.error("Error generating pre-learning lesson plans:", error.message);
      if (error.response) {
        return res.status(error.response.status).json({
          message: 'Failed to generate pre-learning lesson plan.',
          error: error.response.data.detail || error.message,
        });
      }
      res.status(500).json({ message: "Internal server error.", error: error.message });
    }
  });
  
  
  
  
  
  
  
  // Route to call Python FastAPI Lesson Plan service
  router.post('/generate-prelearning-lesson-plan', async (req, res) => {
    try {
      // Request payload sent to Python API
      const payload = req.body;
  
      console.log('Sending request to Python service:', JSON.stringify(payload, null, 2));
  
      // Call Python service
      const pythonResponse = await axios.post('http://localhost:8000/generate-prelearning-plan', payload);
  
      // Send response back to frontend
      res.status(200).json({
        message: 'Pre-learning lesson plan generated successfully.',
        lessonPlan: pythonResponse.data.lesson_plan,
      });
    } catch (error) {
      console.error('Error calling Python service:', error.message);
      if (error.response) {
        return res.status(error.response.status).json({
          message: 'Failed to generate pre-learning lesson plan.',
          error: error.response.data.detail || error.message,
        });
      }
      res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
  });
  