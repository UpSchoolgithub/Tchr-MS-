const express = require("express");
const axios = require("axios");
const {
  Session,
  SessionPlan,
  Topic,
  Concept,
  ClassInfo,
  Subject,
  LessonPlan
} = require("../models"); // Import models

const router = express.Router();

// Helper function to allocate time based on word count of concept details
function allocateDurations(concepts, conceptDetails, totalDuration) {
  const wordCounts = conceptDetails.map((detail) => (detail ? detail.split(" ").length : 1));
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);

  if (totalWords === 0) {
    return Array(concepts.length).fill(Math.floor(totalDuration / concepts.length));
  }

  const durations = wordCounts.map((count) => Math.floor((count / totalWords) * totalDuration));

  // Adjust any rounding errors
  const allocatedTotal = durations.reduce((sum, duration) => sum + duration, 0);
  if (allocatedTotal < totalDuration) {
    durations[durations.length - 1] += totalDuration - allocatedTotal;
  }

  return durations;
}

// Route to generate lesson plan automatically for a session
router.post("/sessionPlans/:sessionId/generateLessonPlan", async (req, res) => {
  const { sessionId } = req.params;
  const { sessionType = "Theory", duration = 45 } = req.body;

  try {
    // ✅ Fetch Session Metadata
    const sessionInfo = await Session.findOne({
      where: { id: sessionId },
      include: [
        { model: ClassInfo, attributes: ["className", "board"] },
        { model: Subject, attributes: ["subjectName"] }
      ],
    });

    if (!sessionInfo) {
      return res.status(404).json({ message: "Session metadata not found." });
    }

    const board = sessionInfo.ClassInfo?.board || "Unknown Board";
    const grade = sessionInfo.ClassInfo?.className || "Unknown Grade";
    const subject = sessionInfo.Subject?.subjectName || "Unknown Subject";

    // ✅ Fetch Session Plan (Unit & Chapter)
    const sessionPlan = await SessionPlan.findOne({
      where: { sessionId },
      attributes: ["unit", "chapter"],
    });

    const unit = sessionPlan?.unit || "Unknown Unit";
    const chapter = sessionPlan?.chapter || "Unknown Chapter";

    // ✅ Fetch Topics and Concepts
    const sessionPlans = await SessionPlan.findAll({
      where: { sessionId },
      include: [
        {
          model: Topic,
          as: "Topics",
          include: [
            {
              model: Concept,
              as: "Concepts",
              attributes: ["id", "concept", "conceptDetailing"],
            },
          ],
        },
      ],
    });

    if (!sessionPlans.length) {
      return res.status(404).json({ message: "No session plans found." });
    }

    // ✅ Prepare Payload for Python API
    const topics = sessionPlans.flatMap((plan) =>
      plan.Topics.map((topic) => ({
        topic: topic.topicName,
        concepts: topic.Concepts.map((concept) => concept.concept),
        conceptDetails: topic.Concepts.map((concept) => concept.conceptDetailing || ""),
      }))
    );

    const payload = {
      board,
      grade,
      subject,
      unit,
      chapter,
      sessionType,
      duration,
      topics,
    };

    console.log("🚀 Payload to Python Service:", JSON.stringify(payload, null, 2));

    // ✅ Send Request to Python Lesson Plan Service
    const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
    const response = await axios.post(pythonServiceUrl, payload, { timeout: 60000 });

    // ✅ Save Generated Lesson Plans to DB
    for (const plan of sessionPlans) {
      for (const topic of plan.Topics) {
        for (const concept of topic.Concepts) {
          await LessonPlan.upsert({
            conceptId: concept.id,
            generatedLP: response.data.lesson_plan[topic.topic]?.[concept.concept]?.lesson_plan || "No Lesson Plan Generated",
          });
        }
      }
    }

    res.status(200).json({ message: "Lesson plan generated and saved successfully." });
  } catch (error) {
    console.error("❌ Error generating lesson plan:", error.stack);
    res.status(500).json({
      message: "Failed to generate lesson plan.",
      error: error.message,
    });
  }
});

module.exports = router;
