const express = require("express");
const axios = require("axios");
const { Session, SessionPlan, Topic, Concept, ClassInfo, Subject, LessonPlan  } = require("../models"); // Import models
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
  const { sessionType = "Theory", duration = 45 } = req.body; // Default values

  try {
    // Fetch session plan with associated topics and concepts
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
              include: LessonPlan ? [
                {
                  model: LessonPlan,
                  as: "LessonPlan",
                  attributes: ["generatedLP"],
                },
              ] : [],
            },
          ],
        },
      ],
    });

    if (!sessionPlans || sessionPlans.length === 0) {
      return res.status(404).json({ message: "Session plans not found." });
    }

    // Prepare topics payload
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

    // Generate API payload
    const payload = {
      board: req.body.board || "Unknown Board",
      grade: req.body.grade || "Unknown Grade",
      subject: req.body.subject || "Unknown Subject",
      unit: req.body.unit || "Unknown Unit",
      chapter: req.body.chapter || "Unknown Chapter",
      sessionType,
      duration,
      topics: processedTopics,
    };

    console.log("Generated Payload:", JSON.stringify(payload, null, 2));

    // Send request to external API
    const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
    const response = await axios.post(pythonServiceUrl, payload, { timeout: 50000 });

    // Save generated lesson plans
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
    console.error("Error generating lesson plan:", error.message);
    res.status(500).json({
      message: "Failed to generate lesson plan. Please try again.",
      error: error.message,
    });
  }
});


module.exports = router;
