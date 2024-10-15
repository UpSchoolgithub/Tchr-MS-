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

// Fetch sessions for a specific subject within a section and class
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  const { schoolId, classId, sectionId, subjectId } = req.params;
  
  try {
    const section = await Section.findOne({
      where: { id: sectionId, classInfoId: classId, schoolId }
    });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const subject = await Subject.findOne({
      where: { id: subjectId, sectionId: section.id }
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

// Create a new session for a specific subject within a section and class
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  const { schoolId, classId, sectionId, subjectId } = req.params;
  const { chapterName, numberOfSessions, priorityNumber } = req.body;

  if (!chapterName || !numberOfSessions || !priorityNumber) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const section = await Section.findOne({ where: { id: sectionId, classInfoId: classId, schoolId } });
    if (!section) return res.status(404).json({ error: 'Section not found' });

    const subject = await Subject.findOne({ where: { id: subjectId, sectionId: section.id } });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const existingSession = await Session.findOne({
      where: { sectionId: section.id, subjectId: subject.id, priorityNumber }
    });
    if (existingSession) return res.status(400).json({ error: 'Priority number must be unique within the subject' });

    const newSession = await Session.create({
      schoolId,
      classId,
      sectionId: section.id,
      subjectId: subject.id,
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

// Update a session for a specific subject within a section and class
router.put('/schools/:schoolId/classes/:classId/sections/:sectionId/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { numberOfSessions, priorityNumber } = req.body;

  try {
    const session = await Session.findByPk(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const existingSession = await Session.findOne({
      where: {
        sectionId: session.sectionId,
        subjectId: session.subjectId,
        priorityNumber,
        id: { [Sequelize.Op.ne]: sessionId }
      }
    });
    if (existingSession) return res.status(400).json({ error: 'Priority number must be unique within the subject' });

    await session.update({ numberOfSessions, priorityNumber });
    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Upload file and create sessions for a specific subject within a section and class
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions/upload', upload.single('file'), async (req, res) => {
  const { schoolId, classId, sectionId, subjectId } = req.params;
  console.log('Upload parameters:', { schoolId, classId, sectionId, subjectId });
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    console.log('File path:', filePath);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const section = await Section.findOne({ where: { id: sectionId, classInfoId: classId, schoolId } });
    if (!section) return res.status(404).json({ error: 'Section not found' });

    const subject = await Subject.findOne({ where: { id: subjectId, sectionId: section.id } });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const sessions = jsonData.map(row => ({
      schoolId,
      classId,
      sectionId: section.id,
      subjectId: subject.id,
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

// Duplicate sessions and session plans for a new section with subject association
router.post('/duplicate-sessions', async (req, res) => {
  const { schoolId, classId, sourceSectionId, targetSectionId, subjectId } = req.body;

  try {
    const sessions = await Session.findAll({
      where: { schoolId, classId, sectionId: sourceSectionId, subjectId }
    });

    for (const session of sessions) {
      const newSession = await Session.create({
        schoolId,
        classId,
        sectionId: targetSectionId,
        subjectId,
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
    console.error('Error duplicating sessions and session plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
