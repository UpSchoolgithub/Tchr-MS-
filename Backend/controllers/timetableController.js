const { TimetableEntry, Section } = require('../models');

exports.assignPeriod = async (req, res) => {
  const { schoolId, classId, combinedSectionId, subjectId, teacherId, day, period } = req.body;

  if (!schoolId || !classId || !combinedSectionId || !subjectId || !teacherId || !day || !period) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newEntry = await TimetableEntry.create({
      schoolId,
      classId,
      combinedSectionId,
      subjectId,
      teacherId,
      day,
      period
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating timetable entry:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
