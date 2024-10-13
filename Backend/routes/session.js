const express = require('express');
const { Sequelize } = require('sequelize');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const Session = require('../models/Session');
const SessionPlan = require('../models/SessionPlan');
const Section = require('../models/Section');
const Subject = require('../models/Subject');

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

// Fetch all sessions for a class and section by sectionId
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions', async (req, res) => {
  try {
    const section = await Section.findOne({
      where: {
        id: req.params.sectionId,
        classInfoId: req.params.classId,
        schoolId: req.params.schoolId
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const sessions = await Session.findAll({
      where: { sectionId: section.id }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create a new session in a section by sectionId
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions', async (req, res) => {
  const { chapterName, numberOfSessions, priorityNumber } = req.body;

  try {
    const section = await Section.findOne({
      where: {
        id: req.params.sectionId,
        classInfoId: req.params.classId,
        schoolId: req.params.schoolId
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const newSession = await Session.create({
      classId: req.params.classId,
      sectionId: section.id,
      chapterName,
      numberOfSessions,
      priorityNumber
    });

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create session', error: error.message });
  }
});

// Update a session by sessionId
router.put('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  const { numberOfSessions, priorityNumber } = req.body;

  try {
    const session = await Session.findByPk(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.update({ numberOfSessions, priorityNumber });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete a session by sessionId
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

// Fetch a session by sessionId
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Route to duplicate sessions and session plans for a new section
router.post('/duplicate-sessions', async (req, res) => {
  const { schoolId, classId, sourceSectionId, targetSectionId } = req.body;

  try {
    const sessions = await Session.findAll({
      where: {
        schoolId,
        classId,
        sectionId: sourceSectionId
      }
    });

    for (const session of sessions) {
      const newSession = await Session.create({
        schoolId,
        classId,
        sectionId: targetSectionId,
        chapterName: session.chapterName,
        numberOfSessions: session.numberOfSessions,
        priorityNumber: session.priorityNumber
      });

      const sessionPlans = await SessionPlan.findAll({ where: { sessionId: session.id } });
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

    const section = await Section.findOne({ where: { id: sectionId, classInfoId: classId, schoolId } });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const sessions = [];
    for (const row of jsonData) {
      const { ChapterName, NumberOfSessions, PriorityNumber } = row;

      sessions.push({
        schoolId,
        classId,
        sectionId: section.id,
        chapterName: ChapterName,
        numberOfSessions: NumberOfSessions,
        priorityNumber: PriorityNumber
      });
    }

    await Session.bulkCreate(sessions);
    res.status(201).json({ message: 'Sessions uploaded and created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Batch delete sessions
router.delete('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions', async (req, res) => {
  try {
    const section = await Section.findOne({
      where: {
        id: req.params.sectionId,
        classInfoId: req.params.classId,
        schoolId: req.params.schoolId
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    await Session.destroy({ where: { sectionId: section.id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sessions' });
  }
});

module.exports = router;
