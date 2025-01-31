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
  console.log("Received sessionId:", sessionId);

  const { sessionType = "Theory", duration = 45 } = req.body;

  try {
    // ✅ Fetch session metadata (board, grade, subject, unit, chapter)
    const sessionInfo = await Session.findOne({
      where: { id: sessionId },
      include: [
        {
          model: ClassInfo,
          attributes: ["className", "board"], // Fetch Class Name (Grade) & Board
        },
        {
          model: Subject,
          attributes: ["subjectName"], // Fetch Subject Name
        },
      ],
    });

    if (!sessionInfo) {
      return res.status(404).json({ message: "Session metadata not found." });
    }

    // Extract Metadata
    const board = sessionInfo.ClassInfo?.board || "Unknown Board";
    const grade = sessionInfo.ClassInfo?.className || "Unknown Grade";
    const subject = sessionInfo.Subject?.subjectName || "Unknown Subject";

    // ✅ Fetch session plan (unit & chapter) separately from `SessionPlan`
    const sessionPlan = await SessionPlan.findOne({
      where: { sessionId },
      attributes: ["unit", "chapter"], // Fetch Unit & Chapter
    });

    const unit = sessionPlan?.unit || "Unknown Unit";
    const chapter = sessionPlan?.chapter || "Unknown Chapter";

    console.log("✅ Metadata Fetched:", { board, grade, subject, unit, chapter });

    // ✅ Fetch session plan with associated topics and concepts
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
              include: [
                {
                  model: LessonPlan,
                  as: "LessonPlan",
                  attributes: ["generatedLP"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!sessionPlans || sessionPlans.length === 0) {
      return res.status(404).json({ message: "Session plans not found." });
    }

    // ✅ Prepare topics payload
    const processedTopics = sessionPlans.flatMap((plan) =>
      plan.Topics.map((topic) => {
        const concepts = topic.Concepts.map((concept) => concept.concept);
        const conceptDetails = topic.Concepts.map((concept) => concept.conceptDetailing || "");

        return {
          topic: topic.topicName,
          concepts: concepts.map((concept, index) => ({
            concept,
            detailing: conceptDetails[index],
          })),
        };
      })
    );

    // ✅ Final Payload for API
    const payload = {
      board,
      grade,
      subject,
      unit,
      chapter,
      sessionType,
      duration,
      topics: processedTopics,
    };

    console.log("🚀 Final Payload Sent to API:", JSON.stringify(payload, null, 2));

    // ✅ Send request to external Python service
    const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
    const response = await axios.post(pythonServiceUrl, payload, { timeout: 50000 });

    // ✅ Save generated lesson plans in database
    for (const plan of sessionPlans) {
      for (const topic of plan.Topics) {
        for (const concept of topic.Concepts) {
          await LessonPlan.upsert({
            conceptId: concept.id,
            generatedLP: response.data.lesson_plan || "No Lesson Plan Generated",
          });
        }
      }
    }

    res.status(200).json({ message: "Lesson plan generated and saved successfully." });
  } catch (error) {
    console.error("❌ Error generating lesson plan:", error.stack);
    res.status(500).json({
      message: "Failed to generate lesson plan. Please try again.",
      error: error.message,
    });
  }
});

module.exports = router;
