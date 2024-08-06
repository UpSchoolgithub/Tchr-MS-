const { TimetableEntry, Section, sequelize } = require('../models');

/**
 * Assign a period to a timetable
 */
exports.assignPeriod = async (req, res) => {
  const { schoolId, classId, combinedSectionId, subjectId, teacherId, day, period } = req.body;

  // Check if all required fields are present
  if (!schoolId || !classId || !combinedSectionId || !subjectId || !teacherId || !day || !period) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const transaction = await sequelize.transaction();  // Start a new transaction

  try {
    // Create a new timetable entry within a transaction
    const newEntry = await TimetableEntry.create({
      schoolId,
      classId,
      combinedSectionId,
      subjectId,
      teacherId,
      day,
      period
    }, { transaction });

    // Extract sectionName from combinedSectionId, assuming the format is always correct
    const sectionName = combinedSectionId.split('-').slice(2).join('-');

    // Find or create the section with the combinedSectionId, within the same transaction
    await Section.findOrCreate({
      where: { schoolId, classInfoId: classId, sectionName },
      defaults: { combinedSectionId },
      transaction
    });

    await transaction.commit();  // Commit the transaction if all operations were successful
    res.status(201).json(newEntry);
  } catch (error) {
    await transaction.rollback();  // Rollback the transaction in case of an error
    console.error('Error creating timetable entry:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

/**
 * Fetch assignments for a specific section
 */
exports.getAssignments = async (req, res) => {
  const { schoolId, classId, sectionName } = req.params;
  const combinedSectionId = `${schoolId}-${classId}-${sectionName}`;

  try {
    // Fetch all assignments associated with the combinedSectionId
    const assignments = await TimetableEntry.findAll({ where: { combinedSectionId } });
    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
