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
      console.log("Incoming payload from frontend:", req.body);
  
      if (!board || !grade || !subject || !chapter || !topics || topics.length === 0) {
        console.error("Validation failed. Missing fields or empty topics.");
        return res.status(400).json({
          message: "Invalid payload. Missing required fields or topics.",
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
  
      // Debug payload to Python service
      console.log("Payload sent to Python service:", payload);
  
      const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
  
      const response = await axios.post(pythonServiceUrl, payload);
  
      // Debug response from Python service
      console.log("Response from Python service:", response.data);
  
      res.status(200).json(response.data);
    } catch (error) {
      console.error("Error in dynamicLP route:", error.message);
      if (error.response) {
        console.error("Python service error:", error.response.data);
      }
      res.status(500).json({
        message: "Failed to generate lesson plan. Please try again.",
        error: error.message,
      });
    }
  });
  
module.exports = router;
