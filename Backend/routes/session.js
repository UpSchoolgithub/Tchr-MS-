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

// Bulk upload sessions for a subject within a section and class
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions/upload', upload.single('file'), async (req, res) => {
  try {
    // Log incoming parameters
    const { schoolId, classId, sectionId, subjectId } = req.params;
    console.log('Parameters:', { schoolId, classId, sectionId, subjectId });

    // Verify file upload
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'File is required' });
    }
    console.log('Uploaded file path:', req.file.path);

    // Read and parse the Excel file
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log('Parsed file data:', jsonData);

    if (!jsonData.length) {
      console.log('Uploaded file is empty or contains no valid data');
      return res.status(400).json({ error: 'Uploaded file is empty or invalid' });
    }

    // Array to collect error messages
    const errors = [];

    // Validate and prepare the session data
    const sessions = jsonData.map((row, index) => {
      const chapterName = row.ChapterName;
      const numberOfSessions = row.NumberOfSessions;
      const priorityNumber = row.PriorityNumber;

      // Check for missing fields in each row and collect errors
      const missingFields = [];
      if (!chapterName) missingFields.push('ChapterName');
      if (!numberOfSessions) missingFields.push('NumberOfSessions');
      if (!priorityNumber) missingFields.push('PriorityNumber');

      if (missingFields.length) {
        errors.push(`Row ${index + 1}: Missing fields - ${missingFields.join(', ')}`);
      }

      return {
        schoolId,
        classId,
        sectionId,
        subjectId,
        chapterName,
        numberOfSessions,
        priorityNumber
      };
    });

    // If there are errors, log and return them
    if (errors.length) {
      console.log('Errors:', errors);
      return res.status(400).json({ error: 'Some fields are missing', details: errors });
    }

    // Insert sessions into the database if no errors
    await Session.bulkCreate(sessions);
    res.status(201).json({ message: 'Sessions uploaded and created successfully' });
  } catch (error) {
    console.error('Error uploading sessions:', error.message);
    res.status(500).json({ error: error.message || 'Failed to upload sessions' });
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
