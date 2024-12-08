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

    // Prepare payloads for each topic-concept combination
    const lessonPlans = [];

    for (const topic of topics) {
      if (!topic.topic || !topic.concepts || topic.concepts.length === 0) {
        console.warn(`Skipping topic ${topic.topic || "Unnamed"} due to missing concepts.`);
        continue;
      }

      for (const concept of topic.concepts) {
        const payload = {
          board,
          grade,
          subject,
          subSubject: "Conisder relavant subject", // Hardcoded value
          unit,
          chapter,
          topic: topic.topic, // Include topic name
          concept, // Include the specific concept
          sessionType,
          noOfSession,
          duration,
        };

        // Debug each payload
        console.log("Payload for topic-concept pair:", JSON.stringify(payload, null, 2));

        // Send to Python service
        try {
          const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
          const response = await axios.post(pythonServiceUrl, payload);
          lessonPlans.push({
            topic: topic.topic,
            concept,
            lessonPlan: response.data.lesson_plan, // Assuming the Python service returns a `lesson_plan`
          });
        } catch (error) {
          console.error(`Error generating lesson plan for topic "${topic.topic}" and concept "${concept}":`, error.message);
          lessonPlans.push({
            topic: topic.topic,
            concept,
            lessonPlan: `Error generating lesson plan for concept "${concept}".`,
          });
        }
      }
    }

    // Return all lesson plans
    res.status(200).json({ lessonPlans });
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
