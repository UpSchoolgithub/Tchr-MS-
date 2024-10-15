const express = require('express');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const Session = require('../models/Session');
const Section = require('../models/Section');
const Subject = require('../models/Subject');

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

// Fetch all sessions for a specific school, class, section, and subject
router.get('/schools/:schoolId/classes/:classId/sections/:sectionName/subjects/:subjectName/sessions', async (req, res) => {
  const { schoolId, classId, sectionName, subjectName } = req.params;

  try {
    const section = await Section.findOne({
      where: { sectionName, classInfoId: classId, schoolId }
    });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const subject = await Subject.findOne({
      where: { subjectName, sectionId: section.id }
    });
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const sessions = await Session.findAll({
      where: { sectionId: section.id, subjectId: subject.id }
    });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
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
    console.error('Error updating session:', error);
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
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Handle file upload and create sessions based on file content
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions/upload', upload.single('file'), async (req, res) => {
  const { schoolId, classId, sectionId, subjectId } = req.params;
  console.log('Route parameters:', { schoolId, classId, sectionId, subjectId });

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    console.log('File path:', filePath);

    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log('Parsed JSON data:', jsonData);

    const section = await Section.findOne({ where: { id: sectionId, classInfoId: classId, schoolId } });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const subject = await Subject.findOne({ where: { id: subjectId, sectionId: section.id } });
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found in this section.' });
    }

    const sessions = jsonData.map(row => ({
      sessionDate: row.sessionDate || null,
      topic: row.ChapterName,
      numberOfSessions: row.NumberOfSessions || 1,
      priorityNumber: row.PriorityNumber || 0,
      sectionId: section.id,
      subjectId: subject.id,
    }));
    console.log('Session data to be inserted:', sessions);

    await Session.bulkCreate(sessions);
    res.status(201).json({ message: 'Sessions uploaded and created successfully' });
  } catch (error) {
    console.error('Error uploading sessions:', error);
    res.status(500).json({ error: 'Failed to upload sessions' });
  }
});

module.exports = router;
