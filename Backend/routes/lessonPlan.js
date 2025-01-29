const express = require("express");
const axios = require("axios");
const { SessionPlan, Topic, Concept, LessonPlan } = require("../models");

const router = express.Router();

// Route to generate lesson plan
router.post("/:sessionId/generate", async (req, res) => {
  const { sessionId } = req.params;
  const { sessionType = "Theory", duration = 45 } = req.body;

  try {
    console.log("Received sessionId:", sessionId);

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

    const processedTopics = sessionPlans.flatMap((plan) =>
      plan.Topics.map((topic) => {
        const concepts = topic.Concepts.map((concept) => ({
          concept: concept.concept,
          detailing: concept.conceptDetailing || "",
        }));

        return {
          topic: topic.topicName,
          concepts,
        };
      })
    );

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

    const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
    const response = await axios.post(pythonServiceUrl, payload, { timeout: 50000 });

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
