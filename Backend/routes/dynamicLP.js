const express = require("express");
const axios = require("axios");
const { Session, SessionPlan, Topic, Concept, ClassInfo, Subject, LessonPlan } = require("../models"); // Import models
const router = express.Router();

// Route to generate lesson plan automatically for a session
router.post("/sessionPlans/:sessionId/generateLessonPlan", async (req, res) => {
  const { sessionId } = req.params;
  console.log("Received sessionId:", sessionId); // Debugging

  const { sessionType = "Theory", duration = 45 } = req.body; // Default values

  try {
    // ✅ **Fetch session details with related metadata**
    const sessionInfo = await Session.findOne({
      where: { id: sessionId },
      include: [
        {
          model: ClassInfo,
          attributes: ["className", "board"], // ✅ Fetch Board and Grade
        },
        {
          model: Subject,
          attributes: ["subjectName"], // ✅ Fetch Subject Name
        },
        {
          model: SessionPlan,
          attributes: [] // ❌ Remove unit and chapter since they do not exist
        },
      ],
      attributes: ["id"], // Only fetch valid fields
    });
    
    
    if (!sessionInfo) {
      return res.status(404).json({ message: "Session metadata not found." });
    }
    
    // Extract Metadata from Database
    const board = sessionInfo.ClassInfo?.board || "Unknown Board";
    const grade = sessionInfo.ClassInfo?.className || "Unknown Grade";
    const subject = sessionInfo.Subject?.subjectName || "Unknown Subject";
    const unit = sessionInfo?.unit || "Unknown Unit";  // ✅ Fix here
    const chapter = sessionInfo?.chapter || "Unknown Chapter";  // ✅ Fix here
    
    console.log("✅ Metadata Fetched:", { board, grade, subject, unit, chapter });
    
    // ✅ **Fetch Session Plan Topics & Concepts**
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

    if (!sessionPlans || sessionPlans.length === 0) {
      return res.status(404).json({ message: "No session plan topics found." });
    }

    // ✅ **Prepare Topics Payload**
    const processedTopics = sessionPlans.flatMap((plan) =>
      plan.Topics.map((topic) => ({
        topic: topic.topicName,
        concepts: topic.Concepts.map((concept) => ({
          concept: concept.concept,
          detailing: concept.conceptDetailing || "",
        })),
      }))
    );

    // ✅ **Final Payload to Python API**
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

    console.log("🚀 Sending Payload to API:", JSON.stringify(payload, null, 2));

    // ✅ **Send request to Python service**
    const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
    let response;
    try {
      response = await axios.post(pythonServiceUrl, payload, { timeout: 50000 });
    } catch (error) {
      console.error("❌ Error calling Python API:", error.message);
      return res.status(502).json({ message: "Failed to fetch lesson plan from AI service.", error: error.message });
    }

    // ✅ **Validate Response from Python API**
    if (!response.data || !response.data.lesson_plan) {
      console.error("❌ Invalid response from AI API:", response.data);
      return res.status(500).json({ message: "Invalid lesson plan response from AI API." });
    }

    console.log("✅ AI Lesson Plan Received:", JSON.stringify(response.data, null, 2));

    // ✅ **Save generated lesson plan in DB**
    for (const plan of sessionPlans) {
      for (const topic of plan.Topics) {
        for (const concept of topic.Concepts) {
          await LessonPlan.upsert({
            conceptId: concept.id,
            generatedLP: response.data.lesson_plan[topic.topicName]?.[concept.concept]?.lesson_plan || "No Lesson Plan Generated",
          });
        }
      }
    }

    res.status(200).json({ message: "Lesson plan generated and saved successfully." });
  } catch (error) {
    console.error("❌ Error generating lesson plan:", error.message);
    res.status(500).json({
      message: "Failed to generate lesson plan. Please try again.",
      error: error.message,
    });
  }
});

module.exports = router;
