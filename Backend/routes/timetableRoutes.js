const express = require('express');
const { TimetableEntry, Section } = require('../models');
const router = express.Router();

// Define the route for assigning a period
router.post('/assign', async (req, res) => {
    const { schoolId, classId, combinedSectionId, subjectId, teacherId, day, period } = req.body;
  
    if (!schoolId || !classId || !combinedSectionId || !subjectId || !teacherId || !day || !period) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
  
    try {
      const existingEntry = await TimetableEntry.findOne({
        where: { schoolId, classId, combinedSectionId, day, period }
      });
  
      if (existingEntry) {
        return res.status(409).json({ error: 'A timetable entry for this period already exists.' });
      }
  
      const newEntry = await TimetableEntry.create({
        schoolId, classId, combinedSectionId, subjectId, teacherId, day, period
      });
  
      const sectionName = combinedSectionId.split('-').slice(2).join('-');
  
      const [section, created] = await Section.findOrCreate({
        where: { schoolId, classInfoId: classId, sectionName },
        defaults: { combinedSectionId }
      });
  
      console.log('New section created:', created); // Logs if a new section was created
  
      res.status(201).json(newEntry);
    } catch (error) {
      console.error('Error creating timetable entry:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
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
