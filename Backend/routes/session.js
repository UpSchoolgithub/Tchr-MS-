const express = require('express');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const Session = require('../models/Session');
const Section = require('../models/Section');

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

// Fetch all sessions by sectionId
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions', async (req, res) => {
  const { schoolId, classId, sectionId } = req.params;
  try {
    const section = await Section.findOne({
      where: {
        id: sectionId,
        classInfoId: classId,
        schoolId
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

// Create a new session by sectionId
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions', async (req, res) => {
  const { classId, sectionId } = req.params;
  const { chapterName, numberOfSessions, priorityNumber } = req.body;

  if (!chapterName || !numberOfSessions || !priorityNumber) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const section = await Section.findOne({
      where: {
        id: sectionId,
        classInfoId: classId,
        schoolId: req.params.schoolId
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const newSession = await Session.create({
      classId,
      sectionId: section.id,
      chapterName,
      numberOfSessions,
      priorityNumber
    });

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update a session by sessionId
router.put('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { numberOfSessions, priorityNumber } = req.body;

  try {
    const session = await Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.update({ numberOfSessions, priorityNumber });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete a session by sessionId
router.delete('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Handle file upload and session creation by sectionId
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/upload', upload.single('file'), async (req, res) => {
  const { schoolId, classId, sectionId } = req.params;

  try {
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const section = await Section.findOne({ where: { id: sectionId, classInfoId: classId, schoolId } });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const sessions = jsonData.map(row => ({
      schoolId,
      classInfoId: classId,
      sectionId: section.id,
      chapterName: row.ChapterName,
      numberOfSessions: row.NumberOfSessions,
      priorityNumber: row.PriorityNumber
    }));

    await Session.bulkCreate(sessions);
    res.status(201).json({ message: 'Sessions uploaded and created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload sessions' });
  }
});

// Batch delete sessions by sectionId
router.delete('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions', async (req, res) => {
  const { sectionId } = req.params;

  try {
    const section = await Section.findOne({
      where: {
        id: sectionId,
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
