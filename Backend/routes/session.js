const express = require('express');
const { Sequelize } = require('sequelize'); // Ensure Sequelize is imported
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const Session = require('../models/Session');
const SessionPlan = require('../models/SessionPlan');
const Section = require('../models/Section');
const Subject = require('../models/Subject'); // Ensure Subject is imported

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Fetch all sessions for a class and section
router.get('/schools/:schoolId/classes/:classId/sections/:sectionName/sessions', async (req, res) => {
  try {
    const section = await Section.findOne({
      where: {
        sectionName: req.params.sectionName,
        classInfoId: req.params.classId,
        schoolId: req.params.schoolId
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const sessions = await Session.findAll({
      where: { classId: req.params.classId, sectionId: section.id }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create a new session
router.post('/schools/:schoolId/classes/:classId/sections/:sectionName/sessions', async (req, res) => {
  const { schoolId, classId, sectionName } = req.params;
  const { chapterName, numberOfSessions, priorityNumber } = req.body;

  if (!chapterName || !numberOfSessions || !priorityNumber) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const section = await Section.findOne({
      where: {
        sectionName: sectionName,
        classInfoId: classId,
        schoolId: schoolId
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const existingSession = await Session.findOne({
      where: { classId, sectionId: section.id, priorityNumber }
    });

    if (existingSession) {
      return res.status(400).json({ error: 'Priority number must be unique within the same section and class' });
    }

    const newSession = await Session.create({
      schoolId,
      classId,
      sectionId: section.id,
      chapterName,
      numberOfSessions,
      priorityNumber
    });

    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update a session
router.put('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { numberOfSessions, priorityNumber } = req.body;

  try {
    const session = await Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const existingSession = await Session.findOne({
      where: {
        classId: session.classId,
        sectionId: session.sectionId,
        priorityNumber,
        id: { [Sequelize.Op.ne]: sessionId } // Use Sequelize.Op.ne to check for existing priority numbers within the same section and class
      }
    });
    if (existingSession) {
      return res.status(400).json({ error: 'Priority number must be unique within the same section and class' });
    }

    await session.update({ numberOfSessions, priorityNumber });
    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete a session
router.delete('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    await session.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Fetch a session by ID
router.get('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Route to duplicate sessions and session plans for a new section
router.post('/duplicate-sessions', async (req, res) => {
  const { schoolId, classId, sourceSectionId, targetSectionId } = req.body;

  try {
    // Fetch all sessions from the source section
    const sessions = await Session.findAll({
      where: {
        schoolId,
        classId,
        sectionId: sourceSectionId
      }
    });

    for (const session of sessions) {
      // Create new session for the target section
      const newSession = await Session.create({
        schoolId,
        classId,
        sectionId: targetSectionId,
        chapterName: session.chapterName,
        numberOfSessions: session.numberOfSessions,
        priorityNumber: session.priorityNumber,
        lessonPlan: session.lessonPlan
      });

      // Fetch all session plans for the current session
      const sessionPlans = await SessionPlan.findAll({
        where: {
          sessionId: session.id
        }
      });

      // Create new session plans for the new session
      for (const plan of sessionPlans) {
        await SessionPlan.create({
          sessionId: newSession.id,
          planDetails: plan.planDetails,
          sessionNumber: plan.sessionNumber
        });
      }
    }

    res.status(201).json({ message: 'Sessions and session plans duplicated successfully' });
  } catch (error) {
    console.error('Error duplicating sessions and session plans:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Route to handle file upload and session creation
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/upload', upload.single('file'), async (req, res) => {
  const { schoolId, classId, sectionId } = req.params;

  try {
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Find the section ID based on the section name
    const section = await Section.findOne({ where: { sectionName: sectionId, classInfoId: classId, schoolId } });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Find the subject based on classId and sectionId
    const subject = await Subject.findOne({ where: { classInfoId: classId, sectionId: section.id, schoolId } });
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const sessions = [];
    for (const row of jsonData) {
      const { ChapterName, NumberOfSessions, PriorityNumber } = row;

      // Check for duplicate chapter name or priority number within the same section and class
      const existingSession = await Session.findOne({
        where: {
          classId,
          sectionId: section.id,
          subjectId: subject.id,
          [Sequelize.Op.or]: [
            { chapterName: ChapterName },
            { priorityNumber: PriorityNumber }
          ]
        }
      });

      if (existingSession) {
        return res.status(400).json({ error: `Duplicate found: Chapter "${ChapterName}" or Priority Number "${PriorityNumber}" already exists.` });
      }

      sessions.push({
        schoolId,
        classId,
        sectionId: section.id,
        subjectId: subject.id,
        chapterName: ChapterName,
        numberOfSessions: NumberOfSessions,
        priorityNumber: PriorityNumber,
      });
    }

    await Session.bulkCreate(sessions);

    res.status(201).json({ message: 'Sessions uploaded and created successfully' });
  } catch (error) {
    console.error('Error uploading sessions:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Batch delete sessions
router.delete('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions', async (req, res) => {
  try {
    const { schoolId, classId, sectionId } = req.params;
    const section = await Section.findOne({
      where: {
        sectionName: sectionId,
        classInfoId: classId,
        schoolId: schoolId
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    await Session.destroy({
      where: { classId: classId, sectionId: section.id }
    });

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sessions' });
  }
});

module.exports = router;
