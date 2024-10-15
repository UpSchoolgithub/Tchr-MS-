const express = require('express');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const { Sequelize } = require('sequelize');
const Session = require('../models/Session');
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

// Fetch sessions for a specific subject within a section and class
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  const { schoolId, classId, sectionId, subjectId } = req.params;

  try {
    const sessions = await Session.findAll({
      where: {
        schoolId,
        classId,
        sectionId,
        subjectId,
      }
    });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create a new session
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  const { schoolId, classId, sectionId, subjectId } = req.params;
  const { chapterName, numberOfSessions, priorityNumber } = req.body;

  try {
    const newSession = await Session.create({
      schoolId,
      classId,
      sectionId,
      subjectId,
      chapterName,
      numberOfSessions,
      priorityNumber,
    });

    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update a session
router.put('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { numberOfSessions, priorityNumber } = req.body;

  try {
    const session = await Session.findByPk(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await session.update({ numberOfSessions, priorityNumber });
    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Upload sessions in bulk for a subject
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions/upload', upload.single('file'), async (req, res) => {
  const { schoolId, classId, sectionId, subjectId } = req.params;

  try {
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const sessions = jsonData.map(row => ({
      schoolId,
      classId,
      sectionId,
      subjectId,
      chapterName: row.ChapterName,
      numberOfSessions: row.NumberOfSessions || 1,
      priorityNumber: row.PriorityNumber || 0,
    }));

    await Session.bulkCreate(sessions);
    res.status(201).json({ message: 'Sessions uploaded and created successfully' });
  } catch (error) {
    console.error('Error uploading sessions:', error);
    res.status(500).json({ error: 'Failed to upload sessions' });
  }
});

// Delete a session by ID
router.delete('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const deletedCount = await Session.destroy({ where: { id: sessionId } });
    if (!deletedCount) return res.status(404).json({ error: 'Session not found' });

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
