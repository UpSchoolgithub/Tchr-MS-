const express = require("express");
const axios = require("axios");

const router = express.Router();

// POST Route for generating lesson plan dynamically
router.post("/dynamicLP", async (req, res) => {
    try {
        const { board, grade, subject, chapter, sessions } = req.body;

        if (!board || !grade || !subject || !chapter || !sessions || sessions.length === 0) {
            return res.status(400).json({ message: "Invalid payload." });
        }

        const groupedPayload = sessions.map(session => ({
            sessionNumber: session.sessionNumber,
            topics: session.topics.map(topic => ({
                topic: topic.topicName,
                concepts: topic.concepts,
            })),
        }));

        const payload = { board, grade, subject, chapter, sessions: groupedPayload };

        const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
        const response = await axios.post(pythonServiceUrl, payload);

        if (!response.data.sessions) throw new Error("Lesson plans not generated.");
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Failed to generate lesson plans." });
    }
});


module.exports = router;
