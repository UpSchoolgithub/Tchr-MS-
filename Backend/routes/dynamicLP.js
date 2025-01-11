const express = require("express");
const axios = require("axios");

const router = express.Router();

// Helper function to calculate proportional time allocation
function allocateDurations(concepts, conceptDetails, totalDuration) {
  const wordCounts = conceptDetails.map((detail) => (detail ? detail.split(" ").length : 1)); // Default to 1 if no detail
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);

  if (totalWords === 0) {
    // Equal allocation if no details are provided
    return Array(concepts.length).fill(Math.floor(totalDuration / concepts.length));
  }

  const durations = wordCounts.map((count) =>
    Math.floor((count / totalWords) * totalDuration)
  );

  // Ensure total time matches exactly
  const allocatedTotal = durations.reduce((sum, duration) => sum + duration, 0);
  if (allocatedTotal < totalDuration) {
    durations[durations.length - 1] += totalDuration - allocatedTotal;
  }

  return durations;
}

// Utility function for field validation
function validateFields(fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return `${key} is required and cannot be empty.`;
    }
  }
  return null;
}

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

    console.log("Incoming payload from frontend:", JSON.stringify(req.body, null, 2));

    // Validate required fields
    const missingFieldError = validateFields({
      board,
      grade,
      subject,
      chapter,
      topics,
    });

    if (missingFieldError) {
      console.error("Validation failed:", missingFieldError);
      return res.status(400).json({
        message: `Invalid payload. ${missingFieldError}`,
      });
    }

    // Process topics to allocate durations and include concept details
    const processedTopics = topics.map((topic) => {
      const concepts = Array.isArray(topic.concepts) ? topic.concepts : [];
      const conceptDetails = Array.isArray(topic.conceptDetails)
        ? topic.conceptDetails
        : [];
      const durations = allocateDurations(concepts, conceptDetails, duration || 45); // Default duration to 45 mins

      // Combine concepts, details, and durations into a structured format
      return {
        ...topic,
        concepts: concepts.map((concept, index) => ({
          concept,
          detail: conceptDetails[index] || "",
          duration: durations[index] || 0,
        })),
      };
    });

    const payload = {
      board,
      grade,
      subject,
      subSubject: "Civics", // Hardcoded value; consider making this configurable
      unit,
      chapter,
      topics: processedTopics,
      sessionType,
      noOfSession,
      duration,
    };

    console.log("Processed Payload:", JSON.stringify(payload, null, 2));

    // Send to Python service with a timeout
    const pythonServiceUrl = "https://dynamiclp.up.school/generate-lesson-plan";
    const response = await axios.post(pythonServiceUrl, payload, {
      timeout: 50000, // 10 seconds timeout
    });

    console.log("Response from Python service:", JSON.stringify(response.data, null, 2));

    res.status(200).json(response.data);
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
