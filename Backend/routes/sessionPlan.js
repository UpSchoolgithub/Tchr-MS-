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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Upload Session Plans
// Upload Session Plans
router.post(
  '/sessions/:sessionId/sessionPlans/upload',
  upload.single('file'),
  async (req, res) => {
    const { sessionId } = req.params;
    const file = req.file;

    try {
      if (!file) {
        throw new Error('No file uploaded');
      }

      if (!file.mimetype.includes('spreadsheetml') && !file.mimetype.includes('excel')) {
        throw new Error('Invalid file format. Please upload an Excel file.');
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

        if (!sessionNumber || !topicName || concepts.length === 0) {
          errors.push({
            row: index + 1,
            reason: 'Missing required fields: SessionNumber, TopicName, or Concepts.',
          });
          return;
        }

        if (concepts.length !== conceptDetailing.length) {
          errors.push({
            row: index + 1,
            reason: 'Mismatch between Concepts and ConceptDetailing.',
          });
          return;
        }

        if (!topicsMap[sessionNumber]) {
          topicsMap[sessionNumber] = [];
        }

        topicsMap[sessionNumber].push(
          ...concepts.map((concept, idx) => ({
            name: topicName,
            concept,
            conceptDetailing: conceptDetailing[idx] || '',
            lessonPlan: '',
          }))
        );
      });

      console.log('Parsed Topics Map:', topicsMap);

      for (const sessionNumber in topicsMap) {
        sessionPlans.push({
          sessionId,
          sessionNumber: parseInt(sessionNumber, 10),
          planDetails: topicsMap[sessionNumber], // Directly pass the array
        });
      }

      console.log('Session Plans:', sessionPlans);

      if (sessionPlans.length > 0) {
        await SessionPlan.bulkCreate(sessionPlans);
      }

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


// Store Generated LP
router.post('/sessionPlans/:id/generateLessonPlan', async (req, res) => {
  const { id } = req.params;
  const { sessionNumber } = req.body;

  try {
    const sessionPlan = await SessionPlan.findByPk(id);
    if (!sessionPlan) {
      return res.status(404).json({ message: 'Session plan not found' });
    }

    // Parse and update planDetails with generated lesson plans
    const planDetails = JSON.parse(sessionPlan.planDetails).map((entry) => {
      if (entry.lessonPlan && entry.lessonPlan.trim()) {
        return entry; // Skip if lessonPlan already exists
      }

      // Generate lesson plan (replace with actual logic)
      const generatedLessonPlan = `Generated lesson plan for ${entry.topicName}`;
      return {
        ...entry,
        lessonPlan: generatedLessonPlan,
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
// Fetch Session Plans
router.get('/sessions/:sessionId/sessionPlans', async (req, res) => {
  const { sessionId } = req.params;

  try {
    console.log(`Fetching session plans for sessionId: ${sessionId}`);
    const sessionPlans = await SessionPlan.findAll({
      where: { sessionId },
    });

    if (!sessionPlans.length) {
      console.warn(`No session plans found for sessionId: ${sessionId}`);
      return res.status(404).json({ message: 'No session plans found' });
    }

    const formattedSessionPlans = sessionPlans.map((plan) => {
      try {
        return {
          ...plan.toJSON(),
          planDetails: JSON.parse(plan.planDetails).map((entry) => ({
            topic: entry.name,
            concept: entry.concept,
            conceptDetailing: entry.conceptDetailing || '',
            lessonPlan: entry.lessonPlan || '',
          })),
        };
      } catch (error) {
        console.error(
          `Error parsing planDetails for sessionPlanId: ${plan.id}`,
          error
        );
        return { ...plan.toJSON(), planDetails: [] };
      }
    });

    res.json(formattedSessionPlans);
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

    sessionPlan.planDetails = JSON.stringify(
      planDetails.map((entry) => ({
        topic: entry.topic,
        concept: entry.concept,
        conceptDetailing: entry.conceptDetailing || "", // Include Concept Detailing
        lessonPlan: entry.lessonPlan || "", // Include lessonPlan during update
      }))
    );

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
    const sessionPlan = await SessionPlan.findByPk(id);
    if (!sessionPlan) {
      return res.status(404).json({ message: 'Session plan not found' });
    }

    const topics = JSON.parse(sessionPlan.planDetails) || [];
    const updatedTopics = [
  ...topics.slice(0, order - 1),
  { name: topicName, concept: "", lessonPlan: "" },
  ...topics.slice(order - 1),
];


    sessionPlan.planDetails = JSON.stringify(updatedTopics);
    await sessionPlan.save();

    res.status(201).json({ message: 'Topic added successfully' });
  } catch (error) {
    console.error('Error adding topic:', error);
    res.status(500).json({ message: 'Internal server error' });
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

//  new route to fetch the required metadata (schoolName, className, sectionName, etc.) without session details.
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/metadata', async (req, res) => {
  const { schoolId, classId, sectionId, subjectId } = req.params;

  try {
    // Fetch school, class, section, and subject details
    const school = await School.findByPk(schoolId, { attributes: ['name'] });
    const classInfo = await ClassInfo.findByPk(classId, { attributes: ['className', 'board'] });
    const section = await Section.findByPk(sectionId, { attributes: ['sectionName'] });
    const subject = await Subject.findByPk(subjectId, { attributes: ['subjectName'] });

    if (!school || !classInfo || !section || !subject) {
      return res.status(404).json({ message: 'One or more entities not found.' });
    }

    // Return only metadata
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
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
