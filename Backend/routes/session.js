const express = require('express');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const { Sequelize } = require('sequelize');
const Session = require('../models/Session');
const Section = require('../models/Section');
const Subject = require('../models/Subject');

const router = express.Router();

// Configure Multer for file uploads
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
  try {
    const { sectionId, subjectId } = req.params;

    const sessions = await Session.findAll({
      where: { sectionId, subjectId },
      attributes: ['id', 'unitName', 'chapterName', 'numberOfSessions', 'priorityNumber', 'topic'],
    });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
});


// Create a new session
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  try {
    const { schoolId, classId, sectionId, subjectId } = req.params;
    const { chapterName, numberOfSessions, priorityNumber } = req.body;

    if (!chapterName || !numberOfSessions || !priorityNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newSession = await Session.create({
      schoolId, classId, sectionId, subjectId, chapterName, numberOfSessions, priorityNumber
    });

    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Upload sessions in bulk from an Excel file
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions/upload', upload.single('file'), async (req, res) => {
  try {
    const { schoolId, classId, sectionId, subjectId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const section = await Section.findByPk(sectionId); // Lookup by sectionId

    if (!section) {
      return res.status(404).json({ error: `Section with ID '${sectionId}' not found` });
    }

    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log("Parsed JSON Data:", jsonData);

    const sessions = jsonData
  .filter(row => {
    if (!row.ChapterName || !row.NumberOfSessions || !row.PriorityNumber) {
      console.warn("Skipping row due to missing fields:", row);
      return false;
    }
    return true;
  })
  .map(row => ({
    schoolId,
    classId,
    sectionId,
    subjectId,
    chapterName: row.ChapterName,
    numberOfSessions: row.NumberOfSessions,
    priorityNumber: row.PriorityNumber,
  }));


    console.log("Sessions Ready for Bulk Insert:", sessions);

    if (sessions.length === 0) {
      return res.status(400).json({ error: 'No valid data to upload.' });
    }

    await Session.bulkCreate(sessions);
    res.status(201).json({ message: 'Sessions uploaded and created successfully' });
  } catch (error) {
    console.error("Error during bulk insert:", error);
    res.status(500).json({ error: 'Failed to upload sessions', details: error.message });
  }
});

// Update a session by ID
router.put('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { numberOfSessions, priorityNumber } = req.body;

    const session = await Session.findByPk(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await session.update({ numberOfSessions, priorityNumber });
    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete a session by ID
router.delete('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const deletedCount = await Session.destroy({ where: { id: sessionId } });
    if (!deletedCount) return res.status(404).json({ error: 'Session not found' });

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
