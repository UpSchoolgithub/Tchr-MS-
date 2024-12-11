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

      const sessionPlans = [];
      const topicsMap = {};
      const errors = [];

      sheet.forEach((row, index) => {
        const sessionNumber = parseInt(row.SessionNumber, 10);
        const topicName = row.TopicName?.trim();
        const concepts = row.Concepts
          ? row.Concepts.split(';').map((concept) => concept.trim())
          : [];
        const conceptDetailing = row.ConceptDetailing
          ? row.ConceptDetailing.split(';').map((detail) => detail.trim())
          : [];

        // Validate required fields
        if (!sessionNumber || !topicName || concepts.length === 0) {
          errors.push({
            row: index + 1,
            reason: 'Missing required fields: SessionNumber, TopicName, or Concepts.',
          });
          return;
        }

        // Check if the number of concepts matches the number of details
        if (concepts.length !== conceptDetailing.length) {
          errors.push({
            row: index + 1,
            reason: 'Mismatch between Concepts and ConceptDetailing.',
          });
          return;
        }

        // Allocate durations proportionally
        const durations = allocateDurations(conceptDetailing, 45); // Assuming 45 minutes per session

        // Initialize the session number in topics map if not already present
        if (!topicsMap[sessionNumber]) {
          topicsMap[sessionNumber] = [];
        }

        // Add concepts to topics map with allocated durations
        topicsMap[sessionNumber].push(
          ...concepts.map((concept, idx) => ({
            name: topicName,
            concept,
            conceptDetailing: conceptDetailing[idx] || '',
            duration: durations[idx] || 0, // Include calculated duration
            lessonPlan: '',
          }))
        );
      });

      // Log parsed topics map for debugging
      console.log('Parsed Topics Map:', topicsMap);

      // Prepare session plans from topics map
      for (const sessionNumber in topicsMap) {
        sessionPlans.push({
          sessionId,
          sessionNumber: parseInt(sessionNumber, 10),
          planDetails: topicsMap[sessionNumber], // Directly pass the array
        });
      }

      // Save session plans to the database
      if (sessionPlans.length > 0) {
        await SessionPlan.bulkCreate(sessionPlans);
      }

      // Send success response
      res.status(201).json({
        message: 'Session plans uploaded successfully',
        uploadedPlans: sessionPlans.length,
        skippedRows: errors.length,
        errors,
      });
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

    const planDetails = JSON.parse(sessionPlan.planDetails).map((entry) => {
      if (entry.lessonPlan && entry.lessonPlan.trim()) {
        return entry; // Skip if lessonPlan already exists
      }

      // Example lesson plan generation logic
      const generatedLessonPlan = `Generated lesson plan for ${entry.concept}`;
      return {
        ...entry,
        lessonPlan: generatedLessonPlan, // Update the lessonPlan field
      };
    });

    // Save updated planDetails back to the database
    sessionPlan.planDetails = JSON.stringify(planDetails);
    await sessionPlan.save();

    res.status(200).json({ message: 'Lesson plans generated and stored successfully', planDetails });
  } catch (error) {
    console.error('Error generating lesson plans:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Fetch Session Plans
router.get('/sessions/:sessionId/sessionPlans', async (req, res) => {
  const { sessionId } = req.params;
  const { page = 1, limit = 10, search = '' } = req.query;

  try {
    console.log(`Fetching session plans for sessionId: ${sessionId}`);
    const offset = (page - 1) * limit;

    const whereCondition = {
      sessionId,
    };

    // Add search filter if provided
    if (search.trim()) {
      whereCondition['planDetails'] = {
        [Op.like]: `%${search.trim()}%`,
      };
    }

    const sessionPlans = await SessionPlan.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    if (sessionPlans.rows.length === 0) {
      console.warn(`No session plans found for sessionId: ${sessionId}`);
      return res.status(404).json({ message: 'No session plans found' });
    }

    const formattedSessionPlans = sessionPlans.rows.map((plan) => {
      try {
        const parsedDetails = typeof plan.planDetails === 'string'
          ? JSON.parse(plan.planDetails)
          : plan.planDetails; // Handle already-parsed data
        return {
          ...plan.toJSON(),
          planDetails: parsedDetails.map((entry) => ({
            topic: entry.name,
            concept: entry.concept,
            conceptDetailing: entry.conceptDetailing || '',
            lessonPlan: entry.lessonPlan || '',
          })),
        };
      } catch (error) {
        console.error(`Error parsing planDetails for sessionPlanId: ${plan.id}`, error);
        return { ...plan.toJSON(), planDetails: [] };
      }
    });

    res.json({
      totalCount: sessionPlans.count,
      totalPages: Math.ceil(sessionPlans.count / limit),
      currentPage: parseInt(page, 10),
      sessionPlans: formattedSessionPlans,
    });
  } catch (error) {
    console.error('Error fetching session plans:', error);
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
