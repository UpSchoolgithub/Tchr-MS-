const express = require('express');
const router = express.Router();
const { TimetableSettings, TimetableEntry, Teacher } = require('../models');

// Get timetable settings for a school
router.get('/schools/:schoolId/timetable', async (req, res) => {
  const schoolId = req.params.schoolId;
  try {
    const timetableSettings = await TimetableSettings.findOne({ where: { schoolId } });
    if (!timetableSettings) {
      return res.status(404).send({ message: 'Timetable not found' });
    }
    res.send(timetableSettings);
  } catch (error) {
    console.error(`Error fetching timetable settings for schoolId=${schoolId}:`, error);
    res.status(500).send({ message: 'Internal server error', error: error.message });
  }
});

// Update or create timetable settings for a school
router.put('/schools/:schoolId/timetable', async (req, res) => {
  const schoolId = req.params.schoolId;
  const settings = req.body;
  try {
    let timetableSettings = await TimetableSettings.findOne({ where: { schoolId } });
    if (!timetableSettings) {
      timetableSettings = await TimetableSettings.create({ schoolId, ...settings });
      return res.send({ message: 'Timetable settings created successfully' });
    }
    await timetableSettings.update(settings);
    res.send({ message: 'Timetable settings updated successfully' });
  } catch (error) {
    console.error(`Error updating timetable settings for schoolId=${schoolId}:`, error);
    res.status(500).send({ message: 'Internal server error', error: error.message });
  }
});

// Assign a teacher and subject to a timetable slot
router.post('/schools/:schoolId/timetable/assign', async (req, res) => {
  const { schoolId } = req.params;
  const { day, period, teacherId, subjectId, classId, sectionId } = req.body;

  try {
    const newEntry = await TimetableEntry.create({
      day,
      period,
      teacherId,
      subjectId,
      classId,
      sectionId,
      schoolId,
    });
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating timetable entry:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
