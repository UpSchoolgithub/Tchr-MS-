const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { Op } = require('sequelize');
const { Model, DataTypes } = require('sequelize');

const SessionPlan = require('../models/SessionPlan');
const Topic = require('../models/Topic');
const School = require('../models/School');
const ClassInfo = require('../models/ClassInfo');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const router = express.Router();
const LessonPlan = require('../models/LessonPlan');
const sequelize = require('../config/db'); // Include sequelize for transactions
const Concept = require('../models/concept'); // Correct the path if needed
const axios = require('axios'); 
const { ActionsAndRecommendations } = require('../models');
const PostLearningActions = require('../models/PostLearningAction');

// Pre-Learning Lesson Plan Generation Route
router.post('/sessionPlans/:id/generatePreLearningLessonPlan', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch all session plans with topics and concepts
    const sessionPlans = await SessionPlan.findAll({
      where: { sessionId: id },
      include: [
        {
          model: Topic,
          as: 'Topics',
          include: [
            {
              model: Concept,
              as: 'Concepts',
            },
          ],
        },
      ],
    });

    if (!sessionPlans || sessionPlans.length === 0) {
      return res.status(404).json({ message: 'Session plan not found' });
    }

    // Validate topics and concepts
    const validateTopic = (topic) => {
      if (!topic.topicName || !Array.isArray(topic.Concepts)) {
        return false;
      }
      return topic.Concepts.every((concept) => concept.concept && concept.conceptDetailing);
    };

    const validSessionPlans = sessionPlans.map((plan) => {
      const validTopics = plan.Topics.filter((topic) => validateTopic(topic));
      return { ...plan, Topics: validTopics };
    });

    if (validSessionPlans.every((plan) => plan.Topics.length === 0)) {
      console.error('Validation failed. No valid topics or concepts.');
      return res.status(400).json({ message: 'Invalid topic or concept structure.' });
    }

    console.log(`Found ${sessionPlans.length} session plans for sessionId ${id}`);

    // Split into 45-minute pre-learning sessions
    const maxDuration = 45; // minutes
    let sessionNumber = -1; // Start from -1 for pre-learning
    const failedConcepts = [];

    for (const plan of validSessionPlans) {
      for (const topic of plan.Topics) {
        const concepts = topic.Concepts;

        // Track current session's concepts
        let currentSessionConcepts = [];
        let currentSessionDuration = 0;

        for (const concept of concepts) {
          const conceptDuration = Math.ceil(concept.conceptDetailing.length / 10); // Estimate based on content length

          if (currentSessionDuration + conceptDuration > maxDuration) {
            // Send current session if it exceeds max duration
            const payload = {
              type: "pre-learning",
              board: req.body.board || "Board Not Specified",
              grade: req.body.grade || "Grade Not Specified",
              subject: req.body.subject || "Subject Not Specified",
              subSubject: "Civics",
              unit: req.body.unit || "Unit Not Specified",
              chapter: topic.topicName,
              sessionType: "Pre-Learning",
              noOfSession: sessionNumber,
              duration: currentSessionDuration,
              topics: [
                {
                  topic: topic.topicName,
                  concepts: currentSessionConcepts,
                },
              ],
            };

            console.log(`Sending payload for session number ${sessionNumber}:`, JSON.stringify(payload, null, 2));

            try {
              // Call external API to generate lesson plan
              const response = await axios.post(
                "https://tms.up.school/api/sessionPlans/generatePreLearningLessonPlan",
                payload
              );

              // Save lesson plan to the database
              for (const c of currentSessionConcepts) {
                await LessonPlan.upsert({
                  conceptId: c.id,
                  generatedLP: response.data.lesson_plan || "No Lesson Plan Generated",
                });
              }

              console.log(`Saved pre-learning lesson plan for session number ${sessionNumber}`);
            } catch (error) {
              console.error(`Failed for session number ${sessionNumber}:`, error.message);
              failedConcepts.push({
                sessionNumber,
                reason: error.message,
              });
            }

            // Reset for the next session
            sessionNumber -= 1;
            currentSessionDuration = 0;
            currentSessionConcepts = [];
          }

          // Add the current concept to the session
          currentSessionConcepts.push({
            id: concept.id,
            concept: concept.concept,
            conceptDetailing: concept.conceptDetailing,
          });
          currentSessionDuration += conceptDuration;
        }

        // Handle remaining concepts (last session)
        if (currentSessionConcepts.length > 0) {
          const finalPayload = {
            type: "pre-learning",
            board: req.body.board || "Board Not Specified",
            grade: req.body.grade || "Grade Not Specified",
            subject: req.body.subject || "Subject Not Specified",
            subSubject: "Civics",
            unit: req.body.unit || "Unit Not Specified",
            chapter: topic.topicName,
            sessionType: "Pre-Learning",
            noOfSession: sessionNumber,
            duration: currentSessionDuration,
            topics: [
              {
                topic: topic.topicName,
                concepts: currentSessionConcepts,
              },
            ],
          };

          console.log(`Sending final session payload:`, JSON.stringify(finalPayload, null, 2));

          try {
            const response = await axios.post(
              "https://tms.up.school/api/sessionPlans/generatePreLearningLessonPlan",
              finalPayload
            );

            for (const c of currentSessionConcepts) {
              await LessonPlan.upsert({
                conceptId: c.id,
                generatedLP: response.data.lesson_plan || "No Lesson Plan Generated",
              });
            }

            console.log(`Saved final pre-learning session for session number ${sessionNumber}`);
          } catch (error) {
            console.error(`Failed for final session number ${sessionNumber}:`, error.message);
            failedConcepts.push({
              sessionNumber,
              reason: error.message,
            });
          }
        }
      }
    }

    res.status(200).json({
      message: 'Pre-learning lesson plans generated successfully.',
      failedConcepts,
    });
  } catch (error) {
    console.error('Error in generating pre-learning lesson plans:', error.message);
    res.status(500).json({ message: 'Failed to generate pre-learning lesson plans.', error: error.message });
  }
});




// Route to call Python FastAPI Lesson Plan service
router.post('/generate-prelearning-lesson-plan', async (req, res) => {
  try {
    // Request payload sent to Python API
    const payload = req.body;

    console.log('Sending request to Python service:', JSON.stringify(payload, null, 2));

    // Call Python service
    const pythonResponse = await axios.post('http://localhost:8000/generate-lesson-plan', payload);

    // Send response back to frontend
    res.status(200).json({
      message: 'Pre-learning lesson plan generated successfully.',
      lessonPlan: pythonResponse.data.lesson_plan,
    });
  } catch (error) {
    console.error('Error calling Python service:', error.message);
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Failed to generate pre-learning lesson plan.',
        error: error.response.data.detail || error.message,
      });
    }
    res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
});


//fetch topics and concepts list for postlearning dropdown
router.get('/sessions/:sessionId/topics', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const sessionPlans = await SessionPlan.findAll({
      where: { sessionId },
      include: [
        {
          model: Topic,
          as: 'Topics',
          attributes: ['id', 'topicName'], // Topic attributes
          include: [
            {
              model: Concept,
              as: 'Concepts',
              attributes: ['id', 'concept', 'conceptDetailing'], // Correct column names
            },
          ],
        },
      ],
    });

    const topics = sessionPlans.flatMap((plan) =>
      (plan.Topics || []).map((topic) => ({
        id: topic.id,
        name: topic.topicName,
        concepts: (topic.Concepts || []).map((concept) => ({
          id: concept.id,
          name: concept.concept,
          detailing: concept.conceptDetailing,
        })),
      }))
    );
    

    res.status(200).json({ topics });
  } catch (error) {
    console.error('Error fetching topics:', error.message);
    res.status(500).json({ message: 'Failed to fetch topics.', error: error.message });
  }
});

// Add post leanring topics fetching
router.post('/sessions/:sessionId/actionsAndRecommendations/postlearning', async (req, res) => {
  const { sessionId } = req.params;
  const { selectedTopics } = req.body;

  console.log("Received Payload:", JSON.stringify(req.body, null, 2)); // Debugging

  if (!Array.isArray(selectedTopics) || selectedTopics.length === 0) {
    return res.status(400).json({ message: 'No topics selected or invalid format.' });
  }

  const transaction = await sequelize.transaction();
  try {
    for (const topic of selectedTopics) {
      console.log(`Processing topic with id: ${topic.id}`);
      const concepts = Array.isArray(topic.concepts) ? topic.concepts : [];  // Check if `concepts` exists in payload
      const conceptIds = concepts.map((concept) => concept.id);  // Map to IDs only

      console.log(`Generated conceptIds for topic ${topic.id}:`, conceptIds); // Debugging

      // Save post-learning action
      await PostLearningActions.create(
        {
          sessionId,
          topicId: topic.id,
          conceptIds,  // This is being saved
          type: 'post-learning',
        },
        { transaction }
      );
    }

    await transaction.commit();
    res.status(201).json({ message: 'Post-learning actions saved successfully.' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error saving post-learning actions:', error.stack);
    res.status(500).json({ message: 'Failed to save post-learning actions.', error: error.message });
  }
});




// save postleanring in A&R

router.post('/sessions/:sessionId/actionsAndRecommendations/postlearning', async (req, res) => {
  const { sessionId } = req.params;
  const { selectedTopics } = req.body;

  console.log("Received Payload:", JSON.stringify(req.body, null, 2)); // Debugging

  if (!Array.isArray(selectedTopics) || selectedTopics.length === 0) {
    return res.status(400).json({ message: 'No topics selected or invalid format.' });
  }

  const transaction = await sequelize.transaction();
  try {
    for (const topic of selectedTopics) {
      console.log(`Processing topic with id: ${topic.id}`);
      const concepts = Array.isArray(topic.selectedConcepts) ? topic.selectedConcepts : [];
      const conceptIds = concepts.map((concept) => concept.id);

      console.log(`Generated conceptIds for topic ${topic.id}:`, conceptIds);

      // Save post-learning action
      await PostLearningActions.create(
        {
          sessionId,
          topicId: topic.id,
          conceptIds,
          type: 'post-learning',
        },
        { transaction }
      );
    }

    await transaction.commit();
    res.status(201).json({ message: 'Post-learning actions saved successfully.' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error saving post-learning actions:', error.stack);
    res.status(500).json({ message: 'Failed to save post-learning actions.', error: error.message });
  }
});



//Fetching Post-Learning Actions
// Fetching Post-Learning Actions (with Topics and Concepts)
router.get('/sessions/:sessionId/actionsAndRecommendations/postlearning', async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Fetch all post-learning actions for the session
    const postLearningActions = await PostLearningActions.findAll({
      where: { sessionId, type: 'post-learning' },
      attributes: ['id', 'sessionId', 'topicId', 'conceptIds'], // Fetch only relevant fields
    });

    // Fetch complete topic and concept details for each action
    const detailedActions = await Promise.all(
      postLearningActions.map(async (action) => {
        // Fetch the topic details for the topicId
        const topic = await Topic.findOne({
          where: { id: action.topicId },
          attributes: ['id', 'topicName'],
        });

        if (!topic) {
          throw new Error(`Topic with ID ${action.topicId} not found.`);
        }

        // Fetch all concepts for the given concept IDs
        const concepts = await Concept.findAll({
          where: {
            id: action.conceptIds,
          },
          attributes: ['id', 'concept', 'conceptDetailing'],
        });

        return {
          ...action.toJSON(),
          topicName: topic.topicName || 'Unknown Topic',
          concepts: concepts.length ? concepts : [{ concept: 'No Concept Found', conceptDetailing: 'N/A' }],
        };
      })
    );

    res.status(200).json({ postLearningActions: detailedActions });
  } catch (error) {
    console.error('Error fetching post-learning actions:', error.message);
    res.status(500).json({ message: 'Failed to fetch post-learning actions.', error: error.message });
  }
});





// Endpoint for Fetching Topics and Concepts for prelearning 
router.post("/api/sessions/:sessionId/actionsAndRecommendations", async (req, res) => {
  const { type, topicName, conceptDetails } = req.body;
  console.log('POST Payload:', JSON.stringify(selectedTopics, null, 2));

  console.log("Received Data:", {
    type,
    topicName,
    conceptDetails,
  });

  // Validate inputs
  if (!type || !['pre-learning', 'post-learning'].includes(type)) {
    return res.status(400).json({ message: 'Invalid or missing type.' });
  }
  if (!topicName || typeof topicName !== 'string' || topicName.trim() === '') {
    return res.status(400).json({ message: 'Topic name is required.' });
  }
  if (!Array.isArray(conceptDetails) || conceptDetails.length === 0) {
    return res.status(400).json({ message: 'Concept details must be a non-empty array.' });
  }

  try {
    // Process the logic...
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Failed to save topic and concepts." });
    console.log('POST Payload:', JSON.stringify(selectedTopics, null, 2));

  }
});

// Restore General Actions and Recommendations Route
router.post('/sessions/:sessionId/actionsAndRecommendations', async (req, res) => {
  const { sessionId } = req.params;
  const { type, topicName, conceptName, conceptDetailing } = req.body;

  try {
    // Validate inputs
    if (!sessionId || !type || !topicName) {
      return res.status(400).json({
        message: 'Session ID, type, topic name, and concept name are required.',
      });
    }

    if (!['pre-learning', 'post-learning'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type provided.' });
    }

    // Create a new action or recommendation
    const actionOrRecommendation = await ActionsAndRecommendations.create({
      sessionId,
      type,
      topicName,
      conceptName,
      conceptDetailing,
    });

    res.status(201).json({
      message: 'Action or recommendation added successfully.',
      actionOrRecommendation,
    });
  } catch (error) {
    console.error('Error adding action or recommendation:', error.message);
    res.status(500).json({
      message: 'Internal server error.',
      error: error.message,
    });
  }
});






// Generate Lesson Plan for A and R
router.post(
  '/sessionPlans/:sessionPlanId/actionsAndRecommendations/:id/generateLessonPlan',
  async (req, res) => {
    const { sessionPlanId, id } = req.params;

    try {
      // Fetch the action/recommendation details
      const actionOrRecommendation = await ActionsAndRecommendations.findByPk(id);

      if (!actionOrRecommendation) {
        return res.status(404).json({ message: 'Action or recommendation not found.' });
      }

      const payload = {
        board: req.body.board || 'Board Not Specified',
        grade: req.body.grade || 'Grade Not Specified',
        subject: req.body.subject || 'Subject Not Specified',
        unit: req.body.unit || 'Unit Not Specified',
        chapter: actionOrRecommendation.topicName,
        sessionType: actionOrRecommendation.type,
        duration: req.body.duration || 45,
        topics: [
          {
            topic: actionOrRecommendation.topicName,
            concepts: [actionOrRecommendation.conceptName],
          },
        ],
      };

      // Call the external API to generate the lesson plan
      const response = await axios.post(
        'https://dynamiclp.up.school/generate-lesson-plan',
        payload
      );

      const generatedLessonPlan = response.data.lesson_plan || 'No Lesson Plan Generated';

      // Save the generated lesson plan
      await LessonPlansForActionsAndRecommendations.create({
        actionsAndRecommendationsId: id,
        generatedLessonPlan,
      });

      res.status(201).json({
        message: 'Lesson plan generated successfully.',
        lessonPlan: generatedLessonPlan,
      });
    } catch (error) {
      console.error('Error generating lesson plan:', error.message);
      res.status(500).json({ message: 'Failed to generate lesson plan.', error: error.message });
    }
  }
);

// Fetching All Actions and Recommendations
router.get('/sessions/:sessionId/actionsAndRecommendations', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const actionsAndRecommendations = await ActionsAndRecommendations.findAll({
      where: { sessionId },
      attributes: ['id', 'sessionId', 'type', 'topicName', 'conceptName', 'conceptDetailing', 'createdAt'],
    });

    const parsedAR = actionsAndRecommendations.map((ar) => ({
      ...ar.toJSON(),
      conceptName: ar.conceptName ? ar.conceptName.split("; ") : [],
      conceptDetailing: ar.conceptDetailing ? ar.conceptDetailing.split("; ") : [],
    }));
    

    res.status(200).json({ actionsAndRecommendations: parsedAR });
  } catch (error) {
    console.error('Error fetching actions and recommendations:', error.message);
    res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
});





// Fetch Generated Lesson Plan for A and R
router.get('/actionsAndRecommendations/:id/lessonPlan', async (req, res) => {
  const { id } = req.params;

  try {
    const lessonPlan = await LessonPlansForActionsAndRecommendations.findOne({
      where: { actionsAndRecommendationsId: id },
    });

    if (!lessonPlan) {
      return res.status(404).json({ message: 'Lesson plan not found.' });
    }

    res.status(200).json({ lessonPlan: lessonPlan.generatedLessonPlan });
  } catch (error) {
    console.error('Error fetching lesson plan:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
//Delete Action or Recommendation
router.delete('/actionsAndRecommendations/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const actionOrRecommendation = await ActionsAndRecommendations.findByPk(id);

    if (!actionOrRecommendation) {
      return res.status(404).json({ message: 'Action or recommendation not found.' });
    }

    await actionOrRecommendation.destroy();

    res.status(200).json({ message: 'Action or recommendation deleted successfully.' });
  } catch (error) {
    console.error('Error deleting action or recommendation:', error.message);
    res.status(500).json({ message: 'Failed to delete action or recommendation.', error: error.message });
  }
});

// Proportional Time Allocation
const allocateDurations = (conceptDetails, totalDuration) => {
  const wordCounts = conceptDetails.map((detail) => (detail ? detail.split(" ").length : 1));
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  return wordCounts.map((count) => Math.floor((count / totalWords) * totalDuration));
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });
// Helper function to validate row data
const validateRow = (row) => {
  console.log("Validating row:", row); // Debugging
  if (!row.SessionNumber || !row.TopicName || !row.Concepts) {
    return 'Missing required fields: SessionNumber, TopicName, or Concepts.';
  }
  const concepts = row.Concepts.split(';');
  const details = row.ConceptDetailing ? row.ConceptDetailing.split(';') : [];
  if (concepts.length !== details.length) {
    return 'Mismatch between Concepts and ConceptDetailing.';
  }
  return null; // No validation errors
};



// Upload Session Plans
router.post(
  '/sessions/:sessionId/sessionPlans/upload',
  upload.single('file'),
  async (req, res) => {
    const { sessionId } = req.params;
    const file = req.file;

    try {
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      if (!file.mimetype.includes('spreadsheetml') && !file.mimetype.includes('excel')) {
        return res.status(400).json({ message: 'Invalid file format. Please upload an Excel file.' });
      }

      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!sheet || sheet.length === 0) {
        return res.status(400).json({ message: 'Uploaded file is empty or invalid.' });
      }

      const sessionPlans = [];
      const errors = [];
      let rowIndex = 1; // Start row index (1-based)

      // Start a transaction
      const transaction = await sequelize.transaction();

      try {
        // Process each row in the uploaded sheet
        for (const [index, row] of sheet.entries()) {
          rowIndex = index + 1; // Update row index

          // Validate row data
          const validationError = validateRow(row);
          if (validationError) {
            errors.push({ row: rowIndex, reason: validationError });
            continue;
          }

          const sessionNumber = parseInt(row.SessionNumber, 10);
          const topicName = row.TopicName.trim();
          const concepts = row.Concepts.split(';').map((c) => c.trim());
          const conceptDetails = row.ConceptDetailing.split(';').map((d) => d.trim());

          try {
            // Create the `SessionPlan` entry
            const sessionPlan = await SessionPlan.create(
              { sessionId, sessionNumber },
              { transaction }
            );

            // Create the `Topic` entry
            const topic = await Topic.create(
              { sessionPlanId: sessionPlan.id, topicName },
              { transaction }
            );

            // Create `Concept` entries linked to the topic
            const conceptEntries = concepts.map((concept, i) => ({
              topicId: topic.id,
              concept,
              conceptDetailing: conceptDetails[i],
            }));
            const conceptsCreated = await Concept.bulkCreate(conceptEntries, { transaction });

            // Create `LessonPlan` entries linked to the concepts
            const lessonPlans = conceptsCreated.map((concept) => ({
              conceptId: concept.id,
              generatedLP: '', // Initially empty
            }));
            await LessonPlan.bulkCreate(lessonPlans, { transaction });

            sessionPlans.push(sessionPlan);
          } catch (err) {
            console.error(`Error processing row ${rowIndex}:`, err.message);
            errors.push({ row: rowIndex, reason: 'Database error during row processing.' });
          }
        }

        // Commit transaction if no critical errors
        await transaction.commit();

        res.status(201).json({
          message: 'Session plans uploaded successfully',
          sessionPlans,
          skippedRows: errors.length,
          errors,
        });
      } catch (error) {
        await transaction.rollback(); // Ensure rollback
        throw error; // Re-throw for outer catch block
      }
    } catch (error) {
      console.error('Error uploading session plans:', error.message);
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
);


// Fetch Specific Topic Details
router.post('/sessionPlans/:id/generateLessonPlan', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch all session plans with topics and concepts
    const sessionPlans = await SessionPlan.findAll({
      where: { sessionId: id },
      include: [
        {
          model: Topic,
          as: 'Topics', // Alias used in the Topic model
          include: [
            {
              model: Concept,
              as: 'Concepts', // Alias used in the Concept model
            },
          ],
        },
      ],
    });
    

    if (!sessionPlans || sessionPlans.length === 0) {
      return res.status(404).json({ message: 'Session plan not found' });
    }

    // Validation function for topics and concepts
    const validateTopic = (topic) => {
      if (!topic.topicName || !Array.isArray(topic.Concepts)) {
        return false; // Missing topic name or concepts
      }
      return topic.Concepts.every(
        (concept) => concept.concept && concept.conceptDetailing
      );
    };

    // Filter valid topics and concepts
    const validSessionPlans = sessionPlans.map((plan) => {
      const validTopics = plan.Topics.filter((topic) => validateTopic(topic));
      return { ...plan, Topics: validTopics };
    });

    if (validSessionPlans.every((plan) => plan.Topics.length === 0)) {
      console.error('Validation failed. No valid topics or concepts.');
      return res.status(400).json({ message: 'Invalid topic or concept structure.' });
    }

    console.log(`Found ${sessionPlans.length} session plans for sessionId ${id}`);

    // Process valid topics and concepts
    for (const plan of validSessionPlans) {
      for (const topic of plan.Topics) {
        for (const concept of topic.Concepts) {
          const payload = {
            board: req.body.board || "Board Not Specified",
            grade: req.body.grade || "Grade Not Specified",
            subject: req.body.subject || "Subject Not Specified",
            subSubject: "Civics", // Hardcoded
            unit: req.body.unit || "Unit Not Specified",
            chapter: topic.topicName, // Keep the topic name for context
            sessionType: req.body.sessionType || "Default",
            noOfSession: req.body.noOfSession || 1,
            duration: req.body.duration || 45,
            topics: [
              {
                topic: topic.topicName, // Topic context
                concepts: [
                  `${concept.concept}: ${concept.conceptDetailing}`.trim(),
                ], // Send only this concept
              },
            ],
          };

          console.log(`Sending payload for concept ID ${concept.id}:`, JSON.stringify(payload, null, 2));

          try {
            // Call external API to generate lesson plan
            const response = await axios.post(
              "https://dynamiclp.up.school/generate-lesson-plan",
              payload
            );

            // Save or update lesson plan using upsert
            try {
              const [lessonPlan, created] = await LessonPlan.upsert({
                conceptId: concept.id,
                generatedLP: response.data.lesson_plan || "No Lesson Plan Generated",
              });
              
            
              console.log(
                `LessonPlan upsert result for conceptId ${concept.id}:`,
                created ? "Created" : "Updated"
              );
            } catch (error) {
              console.error(`Failed to save lesson plan for conceptId ${concept.id}:`, error.message);
            }
            

            console.log(`Saved LP for concept ID: ${concept.id}`);
          } catch (error) {
            console.error(`Failed for concept ID ${concept.id}:`, error.message);

            // Log error response if available
            if (error.response) {
              console.error(
                `Error details for concept ID ${concept.id}:`,
                JSON.stringify(error.response.data, null, 2)
              );
            }
          }
        }
      }
    }

    // Success response
    res.status(200).json({ message: 'Lesson plans generated and saved successfully.' });
  } catch (error) {
    console.error('Error in generating lesson plans:', error.message);
    res.status(500).json({ message: 'Failed to generate lesson plans.', error: error.message });
  }
});







router.get('/sessionPlans/:id/view', async (req, res) => {
  const { id } = req.params;
  try {
    const lessonPlan = await LessonPlan.findOne({
      where: { conceptId: id, generatedLP: { [Op.ne]: "" } }, // Exclude empty generatedLP
      order: [['updatedAt', 'DESC']], // Fetch the latest updated row
    });
        if (!lessonPlan || !lessonPlan.generatedLP) {
      return res.status(404).json({ message: 'Lesson plan not found or not generated.' });
    }
    res.status(200).json({ lessonPlan: lessonPlan.generatedLP });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});



// Save Lesson Plan
router.post('/sessionPlans/:id/saveLessonPlan', async (req, res) => {
  const { id } = req.params; // Session Plan ID
  const { conceptId, generatedLP } = req.body;

  try {
    const lessonPlan = await LessonPlan.findOne({ where: { conceptId } });
    if (!lessonPlan) {
      return res.status(404).json({ message: 'Lesson plan not found.' });
    }

    lessonPlan.generatedLP = generatedLP; // Update the lesson plan
    await lessonPlan.save();

    res.status(200).json({ message: 'Lesson plan saved successfully.' });
  } catch (error) {
    console.error('Error saving lesson plan:', error.message);
    res.status(500).json({
      message: 'Failed to save lesson plan.',
      error: error.message,
    });
  }
});


// Fetch Session Plans
router.get('/sessions/:sessionId/sessionPlans', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const sessionPlans = await SessionPlan.findAll({
      where: { sessionId },
      include: [
        {
          model: Topic,
          as: 'Topics',
          include: [
            {
              model: Concept,
              as: 'Concepts',
              include: [
                {
                  model: LessonPlan,
                  as: 'LessonPlan',
                  attributes: ['generatedLP'],
                },
              ],
              attributes: ['id', 'concept', 'conceptDetailing'],
            },
          ],
        },
      ],
    });

    res.json({ sessionPlans });
  } catch (error) {
    console.error(`Error fetching session plans:`, error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});







// Update Session Plan
router.put('/sessionPlans/:id', async (req, res) => {
  const { id } = req.params;
  const { planDetails } = req.body;

  try {
    const sessionPlan = await SessionPlan.findByPk(id);
    if (!sessionPlan) {
      return res.status(404).json({ message: 'Session plan not found' });
    }

    sessionPlan.planDetails = JSON.stringify(planDetails.map((entry) => ({
      topic: entry.topic,
      concept: entry.concept,
      conceptDetailing: entry.conceptDetailing || "",
      lessonPlan: entry.lessonPlan || "",
    })));
    

    await sessionPlan.save(); // Save the updated session plan

    res.json({ message: 'Session plan updated successfully' });
  } catch (error) {
    console.error('Error updating session plan:', error);
    res.status(500).json({ message: 'Failed to update session plan' });
  }
});


// Add a new topic in the middle
router.post('/sessionPlans/:id/addTopic', async (req, res) => {
  const { id } = req.params;
  const { topicName, order } = req.body;

  try {
    // Validate input fields
    if (!topicName || typeof topicName !== 'string' || topicName.trim() === '') {
      return res.status(400).json({ message: 'Invalid topic name provided. It must be a non-empty string.' });
    }
    if (isNaN(order) || order < 1) {
      return res.status(400).json({ message: 'Invalid order position specified. It must be a positive number.' });
    }

    const sessionPlan = await SessionPlan.findByPk(id);
    if (!sessionPlan) {
      return res.status(404).json({ message: 'Session plan not found' });
    }

    const topics = JSON.parse(sessionPlan.planDetails) || [];
    const updatedTopics = [
      ...topics.slice(0, order - 1),
      { name: topicName, concept: '', lessonPlan: '' },
      ...topics.slice(order - 1),
    ];

    sessionPlan.planDetails = JSON.stringify(updatedTopics);
    await sessionPlan.save();

    res.status(201).json({ message: 'Topic added successfully', updatedTopics });
  } catch (error) {
    console.error('Error adding topic:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Delete Session Plans for a Session
router.delete('/sessions/:sessionId/sessionPlans', async (req, res) => {
  const { sessionId } = req.params;

  try {
    await SessionPlan.destroy({
      where: { sessionId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting session plans:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
});

router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/metadata', async (req, res) => {
  const { schoolId, classId, sectionId, subjectId } = req.params;

  try {
    const school = await School.findByPk(schoolId, { attributes: ['name'] });
    const classInfo = await ClassInfo.findByPk(classId, { attributes: ['className', 'board'] });
    const section = await Section.findByPk(sectionId, { attributes: ['sectionName'] });
    const subject = await Subject.findByPk(subjectId, { attributes: ['subjectName'] });
    const sessionCount = await SessionPlan.count({ where: { sectionId, subjectId } });

    if (!school || !classInfo || !section || !subject) {
      return res.status(404).json({ message: "One or more entities not found." });
    }

    res.json({
      schoolId,
      schoolName: school.name,
      classId,
      className: classInfo.className,
      board: classInfo.board,
      sectionId,
      sectionName: section.sectionName,
      subjectId,
      subjectName: subject.subjectName,
      sessionCount, // New field for session count
    });
  } catch (error) {
    console.error("Error fetching metadata:", error.message);
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
});

module.exports = router;
