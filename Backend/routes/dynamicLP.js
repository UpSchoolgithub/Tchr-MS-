const express = require("express");
const axios = require("axios");

const router = express.Router();

// POST Route for generating lesson plan dynamically
router.post("/dynamicLP", async (req, res) => {
    try {
        const { board, grade, subject, subSubject, unit, chapter, topics, sessionType, noOfSession, duration } = req.body;

        // Prepare payload to send to the Python microservice
        const payload = {
            board,
            grade,
            subject,
            subSubject,
            unit,
            chapter,
            topics,
            sessionType,
            noOfSession,
            duration,
        };

        // Make a POST request to the Python service
        const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";

        const response = await axios.post(pythonServiceUrl, payload);

        // Send back the response from Python service to the frontend
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error in dynamicLP route:", error.message);
        res.status(500).json({
            message: "Failed to generate lesson plan. Please try again.",
            error: error.message,
        });
    }
});

module.exports = router;
