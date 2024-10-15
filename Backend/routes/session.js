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

// Utility function for parameter validation
const validateParams = (params) => {
  const { schoolId, classId, sectionId, subjectId } = params;
  if (!schoolId || !classId || !sectionId || !subjectId) {
    throw new Error('Required parameters are missing');
  }
};

// Fetch sessions for a specific subject within a section and class
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  try {
    validateParams(req.params);
    const { schoolId, classId, sectionId, subjectId } = req.params;

    const sessions = await Session.findAll({
      where: { schoolId, classId, sectionId, subjectId }
    });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create a new session
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  try {
    validateParams(req.params);
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

router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions/upload', upload.single('file'), async (req, res) => {
  try {
    validateParams(req.params);
    const { schoolId, classId, sectionId, subjectId } = req.params;
    const filePath = path.join(__dirname, '../uploads', req.file.filename);

    // Read the file and parse it
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty or invalid' });
    }

    // Ensure that required columns exist in each row
    const sessions = jsonData.map(row => {
      if (!row.ChapterName || !row.NumberOfSessions || !row.PriorityNumber) {
        throw new Error('Missing required fields in the uploaded file.');
      }
      return {
        schoolId,
        classId,
        sectionId,
        subjectId,
        chapterName: row.ChapterName,
        numberOfSessions: row.NumberOfSessions || 1,
        priorityNumber: row.PriorityNumber || 0,
      };
    });

    await Session.bulkCreate(sessions);
    res.status(201).json({ message: 'Sessions uploaded and created successfully' });
  } catch (error) {
    console.error('Error uploading sessions:', error);
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
