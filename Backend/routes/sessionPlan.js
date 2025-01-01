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



// Endpoint for Fetching Topics and Concepts for prelearning 
router.post("/api/sessions/:sessionId/actionsAndRecommendations", async (req, res) => {
  const { type, topicName, conceptDetails } = req.body;

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
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({ actionsAndRecommendations });
  } catch (error) {
    console.error('Error fetching actions and recommendations:', error.message);
    res.status(500).json({
      message: 'Internal server error.',
      error: error.message,
    });
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
