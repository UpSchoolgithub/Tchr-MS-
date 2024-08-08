const { TimetableEntry, Section } = require('../models');
const sequelize = require('../config/db');

exports.assignPeriod = async (req, res) => {
  const { schoolId, classId, combinedSectionId, subjectId, teacherId, day, period } = req.body;

  // Check if all required fields are provided
  if (!schoolId || !classId || !combinedSectionId || !subjectId || !teacherId || !day || !period) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  let transaction;
  try {
    // Start transaction
    transaction = await sequelize.transaction();

    // Check for existing timetable entry to avoid duplicates
    const existingEntry = await TimetableEntry.findOne({
      where: { schoolId, classId, combinedSectionId, day, period },
      transaction
    });

    if (existingEntry) {
      console.log('Duplicate entry detected:', existingEntry);
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
    }, { transaction });

    console.log('Timetable entry created:', newEntry);

    // Extract sectionName from combinedSectionId
    const sectionName = combinedSectionId.split('-').slice(2).join('-');

    // Find or create the section based on combinedSectionId
    const [section, created] = await Section.findOrCreate({
      where: { schoolId, classInfoId: classId, sectionName },
      defaults: { combinedSectionId },
      transaction
    });

    if (created) {
      console.log('New section created:', section);
    } else {
      console.log('Section already exists:', section);
    }

    // Commit transaction
    await transaction.commit();

    res.status(201).json(newEntry);
  } catch (error) {
    // Rollback transaction in case of error
    if (transaction) await transaction.rollback();

    console.error('Error in assignPeriod:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAssignments = async (req, res) => {
  const { schoolId, classId, sectionName } = req.params;
  const combinedSectionId = `${schoolId}-${classId}-${sectionName}`;

  try {
    // Fetch assignments for the given combinedSectionId
    const assignments = await TimetableEntry.findAll({ where: { combinedSectionId } });
    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
};
