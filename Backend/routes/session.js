const express = require('express');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const { Sequelize } = require('sequelize');
const School = require('../models/School');
const ClassInfo = require('../models/ClassInfo');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Session = require('../models/Session');

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
// Also used for fetching schol, class names in frontend 
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  const { schoolId, classId, sectionId, subjectId } = req.params;

  try {
    // Fetch names for IDs
    const school = await School.findByPk(schoolId, { attributes: ['name'] });
    const classInfo = await ClassInfo.findByPk(classId, { attributes: ['className', 'board'] });
    const section = await Section.findByPk(sectionId, { attributes: ['sectionName'] });
    const subject = await Subject.findByPk(subjectId, { attributes: ['subjectName'] });

    if (!school || !classInfo || !section || !subject) {
      return res.status(404).json({ message: 'One or more entities not found.' });
    }

    // Fetch sessions for the subject in the section
    const sessions = await Session.findAll({
      where: { sectionId, subjectId },
      attributes: ['id', 'unitName', 'chapterName', 'numberOfSessions', 'priorityNumber'],
    });

    res.json({
      schoolId,
      schoolName: school.name,
      classInfoId,
      className: classInfo.className,
      board: classInfo.board,
      sectionId,
      sectionName: section.sectionName,
      subjectId,
      subjectName: subject.subjectName,
      sessions,
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ message: 'Error fetching session details', error: error.message });
  }
});


// Function to fetch classInfoId based on sectionId
const getClassInfoIdFromSectionId = async (sectionId) => {
  try {
    const section = await Section.findByPk(sectionId, {
      attributes: ['classInfoId'],
    });
    return section ? section.classInfoId : null; // Return the classInfoId or null if not found
  } catch (error) {
    console.error('Error fetching classInfoId for sectionId:', error.message);
    throw new Error('Failed to fetch classInfoId for section');
  }
};

// Create a new session
// Create a new session with classInfoId included
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  try {
    const { schoolId, classId, sectionId, subjectId } = req.params;
    const { unitName, chapterName, numberOfSessions, priorityNumber } = req.body;

    if (!unitName || !chapterName || !numberOfSessions || !priorityNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const classInfoId = await getClassInfoIdFromSectionId(sectionId); // Fetch the classInfoId

    if (!classInfoId) {
      return res.status(404).json({ error: 'ClassInfo not found for this section.' });
    }

    const newSession = await Session.create({
      schoolId,
      classInfoId, // Use classInfoId here
      sectionId,
      subjectId,
      unitName,
      chapterName,
      numberOfSessions,
      priorityNumber
    });

    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});



// Upload sessions in bulk from an Excel file
// Upload sessions in bulk from an Excel file
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions/upload', upload.single('file'), async (req, res) => {
  try {
    const { schoolId, classId, sectionId, subjectId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const classInfoId = await getClassInfoIdFromSectionId(sectionId); // Fetch the classInfoId

    if (!classInfoId) {
      return res.status(404).json({ error: 'ClassInfo not found for this section.' });
    }

    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log("Parsed JSON Data:", jsonData);

    const sessions = jsonData
      .filter(row => {
        if (!row.UnitName || !row.ChapterName || !row.NumberOfSessions || !row.PriorityNumber) {
          console.warn("Skipping row due to missing fields:", row);
          return false;
        }
        return true;
      })
      .map(row => ({
        schoolId,
        classId: classInfoId, // Set classInfoId
        sectionId,
        subjectId,
        unitName: row.UnitName,
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
// Update a session by ID and include classInfoId
router.put('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId, sectionId } = req.params;
    const { unitName, numberOfSessions, priorityNumber } = req.body;

    const session = await Session.findByPk(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const classInfoId = await getClassInfoIdFromSectionId(sectionId); // Fetch the classInfoId

    if (!classInfoId) {
      return res.status(404).json({ error: 'ClassInfo not found for this section.' });
    }

    await session.update({
      unitName,
      numberOfSessions,
      priorityNumber,
      classInfoId // Update the classInfoId
    });

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

//handle bulk delete requests
// Bulk delete sessions
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/bulk-delete', async (req, res) => {
  try {
    const { sessionIds } = req.body;

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request. No session IDs provided.' });
    }

    const deletedCount = await Session.destroy({
      where: {
        id: sessionIds,
      },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'No sessions found for the provided IDs.' });
    }

    res.status(200).json({ message: `${deletedCount} sessions deleted successfully.` });
  } catch (error) {
    console.error('Error during bulk delete:', error);
    res.status(500).json({ error: 'Failed to delete sessions', details: error.message });
  }
});


module.exports = router;
