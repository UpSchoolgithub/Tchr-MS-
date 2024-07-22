const express = require('express');
const router = express.Router();
const { TimetableEntry, Teacher, Subject, ClassInfo, Section, School, TimetableSettings } = require('../models');

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

// Get timetable entries for a class name and section
router.get('/schools/:schoolId/classes/:className/sections/:sectionName/timetable', async (req, res) => {
  const { schoolId, className, sectionName } = req.params;
  try {
    const timetableEntries = await TimetableEntry.findAll({
      include: [
        { model: ClassInfo, where: { className } },
        { model: Section, where: { sectionName, schoolId } },
        { model: Subject, attributes: ['id', 'subjectName'] },
        { model: Teacher, attributes: ['id', 'name'] }
      ]
    });
    res.status(200).json(timetableEntries);
  } catch (error) {
    console.error('Error fetching timetable entries:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Assign a teacher and subject to a timetable slot
router.post('/schools/:schoolId/timetable/assign', async (req, res) => {
  const { schoolId } = req.params;
  const { day, period, teacherId, subjectId, classId, sectionId } = req.body;

  try {
    const existingEntry = await TimetableEntry.findOne({
      where: { day, period, classInfoId: classId, sectionId }
    });

    if (existingEntry) {
      await existingEntry.update({ teacherId, subjectId });
      return res.status(200).json(existingEntry);
    }

    const newEntry = await TimetableEntry.create({
      day,
      period,
      teacherId,
      subjectId,
      classInfoId: classId,
      sectionId,
      schoolId,
    });
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating timetable entry:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all timetable entries for a specific class and section
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/timetable', async (req, res) => {
  try {
    const { schoolId, classId, sectionId } = req.params;
    const timetableEntries = await TimetableEntry.findAll({
      where: {
        schoolId,
        classInfoId: classId,
        sectionId
      },
      include: [
        { model: Teacher, attributes: ['id', 'name'] },
        { model: Subject, attributes: ['id', 'subjectName'] }
      ]
    });
    res.status(200).json(timetableEntries);
  } catch (error) {
    console.error('Error fetching timetable entries:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update an existing timetable entry
router.put('/schools/:schoolId/classes/:classId/sections/:sectionId/timetable/:entryId', async (req, res) => {
  const { entryId } = req.params;
  const { day, period, teacherId, subjectId } = req.body;

  try {
    const entry = await TimetableEntry.findByPk(entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    await entry.update({
      day,
      period,
      teacherId,
      subjectId,
    });

    res.status(200).json(entry);
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
