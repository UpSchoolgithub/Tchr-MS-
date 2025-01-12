const express = require("express");
const axios = require("axios");
const { Session, SessionPlan, Topic, Concept, ClassInfo, Subject } = require("../models"); // Import models
const router = express.Router();

// Helper function to allocate time based on word count of concept details
function allocateDurations(concepts, conceptDetails, totalDuration) {
  const wordCounts = conceptDetails.map((detail) => (detail ? detail.split(" ").length : 1)); // Default to 1 if no detail
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);

  if (totalWords === 0) {
    return Array(concepts.length).fill(Math.floor(totalDuration / concepts.length));
  }

  const durations = wordCounts.map((count) =>
    Math.floor((count / totalWords) * totalDuration)
  );

  const allocatedTotal = durations.reduce((sum, duration) => sum + duration, 0);
  if (allocatedTotal < totalDuration) {
    durations[durations.length - 1] += totalDuration - allocatedTotal;
  }

  return durations;
}

// Route to generate lesson plan automatically for a session
router.post("/sessionPlans/:sessionId/generateLessonPlan", async (req, res) => {
  const { sessionId } = req.params;
  const { sessionType = "post-learning", duration = 45 } = req.body; // Default values

  try {
    // Fetch session metadata, including class, subject, and topics
    const session = await Session.findOne({
      where: { id: sessionId },
      include: [
        { model: ClassInfo, as: "ClassInfo", attributes: ["className", "board"] },
        { model: Subject, as: "Subject", attributes: ["subjectName"] },
        {
          model: SessionPlan,
          as: "SessionPlans",
          include: [
            {
              model: Topic,
              as: "Topics",
              include: [{ model: Concept, as: "Concepts", attributes: ["id", "concept", "conceptDetailing"] }],
            },
          ],
        },
      ],
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    const { unitName, chapterName } = session;
    const classInfo = session.ClassInfo || {};
    const subject = session.Subject || {};

    // Prepare the topics payload
    const processedTopics = session.SessionPlans.flatMap((plan) =>
      plan.Topics.map((topic) => {
        const concepts = topic.Concepts.map((concept) => concept.concept);
        const conceptDetails = topic.Concepts.map((concept) => concept.conceptDetailing || "");

        const durations = allocateDurations(concepts, conceptDetails, duration);

        return {
          id: topic.id,
          concepts: concepts.map((concept, index) => ({
            concept,
            detail: conceptDetails[index],
            duration: durations[index],
          })),
        };
      })
    );

    // Generate payload for the external API
    const payload = {
      board: classInfo.board || "STATE",
      grade: classInfo.className || "Unknown Grade",
      subject: subject.subjectName || "Unknown Subject",
      unit: unitName || "General Unit",
      chapter: chapterName || "General Chapter",
      sessionType,
      duration,
      topics: processedTopics,
    };

    console.log("Generated Payload:", JSON.stringify(payload, null, 2));

    // Send request to external API
    const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
    const response = await axios.post(pythonServiceUrl, payload, { timeout: 50000 });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in generating lesson plan:", error.message);

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
