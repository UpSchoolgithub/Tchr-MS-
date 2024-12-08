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

    // Debug payload
    console.log("Incoming payload from frontend:", JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!board || !grade || !subject || !chapter || !topics || topics.length === 0) {
      console.error("Validation failed. Missing fields or empty topics.");
      return res.status(400).json({
        message: "Invalid payload. Missing required fields or topics.",
      });
    }

    // Ensure `concepts` is always an array
    const sanitizedTopics = topics.map((topic) => ({
      ...topic,
      concepts: Array.isArray(topic.concepts) ? topic.concepts : [], // Default to empty array
    }));

    const payload = {
      board,
      grade,
      subject,
      subSubject: "Civics", // Hardcoded value
      unit,
      chapter,
      topics: sanitizedTopics,
      sessionType,
      noOfSession,
      duration,
    };

    console.log("Sanitized Payload:", JSON.stringify(payload, null, 2));

    // Send to Python service
    const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
    const response = await axios.post(pythonServiceUrl, payload);

    console.log("Response from Python service:", JSON.stringify(response.data, null, 2));

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in dynamicLP route:", error.message);

    if (error.response) {
      console.error("Python service error details:", JSON.stringify(error.response.data, null, 2));
    }

    res.status(500).json({
      message: "Failed to generate lesson plan. Please try again.",
      error: error.message,
    });
  }
});


module.exports = router;
