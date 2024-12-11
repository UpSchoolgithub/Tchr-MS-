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

      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const sessionPlans = [];
      const topicsMap = {};

      sheet.forEach((row) => {
        const sessionNumber = parseInt(row.SessionNumber, 10);
      
        if (isNaN(sessionNumber)) {
          throw new Error(`Invalid session number: ${row.SessionNumber}`);
        }
      
        const topicName = row.TopicName?.trim();
        const concepts = row.Concepts
          ? row.Concepts.split(';').map((concept) => concept.trim())
          : [];
        const conceptDetailing = row.ConceptDetailing
          ? row.ConceptDetailing.split(';').map((detail) => detail.trim())
          : []; // Parse Concept Detailing
      
        if (!topicsMap[sessionNumber]) {
          topicsMap[sessionNumber] = [];
        }
      
        topicsMap[sessionNumber].push(
          ...concepts.map((concept, index) => ({
            name: topicName,
            concept,
            conceptDetailing: conceptDetailing[index] || "", // Match detailing with concept or default to ""
            lessonPlan: "",
          }))
        );
      });
      

      for (const sessionNumber in topicsMap) {
        sessionPlans.push({
          sessionId,
          sessionNumber: parseInt(sessionNumber, 10),
          planDetails: JSON.stringify(topicsMap[sessionNumber]),
        });
      }
      
      

      const createdSessionPlans = await SessionPlan.bulkCreate(sessionPlans);

      res.status(201).json({
        message: 'Session plans uploaded successfully',
        createdSessionPlans,
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
    const sessionPlans = await SessionPlan.findAll({
      where: { sessionId },
    });

    const formattedSessionPlans = sessionPlans.map((plan) => ({
      ...plan.toJSON(),
      planDetails: JSON.parse(plan.planDetails).map((entry) => ({
        topic: entry.name,
        concept: entry.concept,
        conceptDetailing: entry.conceptDetailing || "", // Include Concept Detailing
        lessonPlan: entry.lessonPlan || "",
      })),
    }));

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
