const express = require("express");
const axios = require("axios");

const router = express.Router();

// POST Route for generating lesson plan dynamically
router.post("/dynamicLP", async (req, res) => {
  try {
    const {
      board,
      grade,
      subject,
      unit,
      chapter,
      topics,
      sessionType,
      noOfSession,
      duration,
    } = req.body;

    // Debug incoming payload
    console.log("Incoming payload from frontend:", JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!board || !grade || !subject || !chapter || !topics || topics.length === 0) {
      console.error("Validation failed. Missing required fields or empty topics.");
      return res.status(400).json({
        message: "Invalid payload. Missing required fields or topics.",
      });
    }

    // Validate topics and concepts structure
    const invalidTopics = topics.filter(
      (topic) => !topic.topic || !Array.isArray(topic.concepts) || topic.concepts.length === 0
    );
    if (invalidTopics.length > 0) {
      console.error("Invalid topics or concepts detected:", JSON.stringify(invalidTopics, null, 2));
      return res.status(400).json({
        message: "Invalid payload. Topics must have valid names and non-empty concepts.",
      });
    }

    const payload = {
      board,
      grade,
      subject,
      unit,
      chapter,
      topics,
      sessionType,
      noOfSession,
      duration,
    };

    // Debug payload before sending to Python service
    console.log("Payload sent to Python service:", JSON.stringify(payload, null, 2));

    const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";

    // Send payload to Python service
    const response = await axios.post(pythonServiceUrl, payload);

    // Debug response from Python service
    console.log("Response from Python service:", JSON.stringify(response.data, null, 2));

    // Send back response to the frontend
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in dynamicLP route:", error.message);

    if (error.response) {
      // Log error details from Python service
      console.error("Python service error details:", JSON.stringify(error.response.data, null, 2));
    }

    res.status(500).json({
      message: "Failed to generate lesson plan. Please try again.",
      error: error.message,
    });
  }
});

module.exports = router;
