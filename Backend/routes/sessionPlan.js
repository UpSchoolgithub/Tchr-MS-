const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { Op } = require('sequelize');
const SessionPlan = require('../models/SessionPlan');
const Topic = require('../models/Topic');
const School = require('../models/School');
const ClassInfo = require('../models/ClassInfo');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const router = express.Router();
const Concept = require('../models/concept'); // Ensure proper casing
const LessonPlan = require('../models/LessonPlan');
const sequelize = require('../config/db'); // Include sequelize for transactions

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
              { sessionId, sessionNumber, topicName },
              { transaction }
            );

            // Create `Concept` and `LessonPlan` entries in bulk
            const conceptEntries = concepts.map((concept, i) => ({
              sessionPlanId: sessionPlan.id,
              concept,
              conceptDetailing: conceptDetails[i],
            }));
            const conceptsCreated = await Concept.bulkCreate(conceptEntries, { transaction });

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
router.get('/sessions/:sessionId/sessionPlans/:sessionNumber', async (req, res) => {
  const { sessionId, sessionNumber } = req.params;

  try {
    const sessionPlan = await SessionPlan.findOne({
      where: { sessionId, sessionNumber },
    });

    if (!sessionPlan) {
      return res.status(404).json({ message: "Session plan not found for the specified session number." });
    }

    res.json(sessionPlan);
  } catch (error) {
    console.error('Error fetching specific session plan:', error.message);
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
});

// Store Generated LP
router.post('/sessionPlans/:id/generateLessonPlan', async (req, res) => {
  const { id } = req.params;

  try {
    const sessionPlan = await SessionPlan.findByPk(id);
    if (!sessionPlan) {
      return res.status(404).json({ message: 'Session plan not found' });
    }

    const planDetails = JSON.parse(sessionPlan.planDetails);

    // Map through planDetails and update lessonPlan field
    const updatedPlanDetails = await Promise.all(
      planDetails.map(async (entry) => {
        if (entry.lessonPlan && entry.lessonPlan.trim()) {
          return entry; // Skip if lessonPlan already exists
        }

        // Call dynamicLP for each topic
        const payload = {
          board: req.body.board,
          grade: req.body.grade,
          subject: req.body.subject,
          unit: req.body.unit,
          chapter: entry.name,
          concepts: [{ concept: entry.concept, detailing: entry.conceptDetailing }],
          sessionType: 'Theory',
          noOfSession: 1,
          duration: entry.duration || 45,
        };

        const response = await axios.post('https://dynamiclp.up.school/generate-lesson-plan', payload);

        return {
          ...entry,
          lessonPlan: response.data.lesson_plan || '', // Update lessonPlan
        };
      })
    );

    // Save updated planDetails back to the database
    sessionPlan.planDetails = JSON.stringify(updatedPlanDetails);
    await sessionPlan.save();

    res.status(200).json({ message: 'Lesson plans generated and stored successfully', updatedPlanDetails });
  } catch (error) {
    console.error('Error generating lesson plans:', error);
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
          model: Concept,
          include: [{ model: LessonPlan }], // Include LessonPlan if needed
        },
      ],
    });

    if (!sessionPlans.length) {
      return res.status(404).json({ message: 'No session plans found.' });
    }

    res.json({ sessionPlans });
  } catch (error) {
    console.error(`Error fetching session plans for sessionId ${sessionId}:`, error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
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
