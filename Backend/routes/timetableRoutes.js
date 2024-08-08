const express = require('express');
const { TimetableEntry, Section } = require('../models');
const router = express.Router();

// Define the route for assigning a period
router.post('/assign', async (req, res) => {
  const { schoolId, classId, combinedSectionId, subjectId, teacherId, day, period } = req.body;

  // Validate required fields
  if (!schoolId || !classId || !combinedSectionId || !subjectId || !teacherId || !day || !period) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Check for existing timetable entry to avoid duplicates
    const existingEntry = await TimetableEntry.findOne({
      where: { schoolId, classId, combinedSectionId, day, period }
    });

    if (existingEntry) {
      return res.status(409).json({ error: 'A timetable entry for this period already exists.' });
    }

    // Create new timetable entry
    const newEntry = await TimetableEntry.create({
      schoolId,
      classId,
      combinedSectionId,
      subjectId,
      teacherId,
      day,
      period
    });

    // Extract sectionName from combinedSectionId
    const sectionName = combinedSectionId.split('-').slice(2).join('-');

    // Find or create the section based on combinedSectionId
    await Section.findOrCreate({
      where: { schoolId, classInfoId: classId, sectionName },
      defaults: { combinedSectionId }
    });

    // Respond with the newly created entry
    res.status(201).json(newEntry);
  } catch (error) {
    // Log the error and respond with a 500 status
    console.error('Error creating timetable entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define the route for fetching assignments
router.get('/:schoolId/:classId/:sectionName/assignments', async (req, res) => {
  const { schoolId, classId, sectionName } = req.params;
  const combinedSectionId = `${schoolId}-${classId}-${sectionName}`;

  try {
    // Fetch all assignments for the given combinedSectionId
    const assignments = await TimetableEntry.findAll({ where: { combinedSectionId } });

    // Respond with the assignments
    res.status(200).json(assignments);
  } catch (error) {
    // Log the error and respond with a 500 status
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
