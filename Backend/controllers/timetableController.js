const { TimetableEntry, Section, sequelize } = require('../models');

exports.assignPeriod = async (req, res) => {
  const { schoolId, classId, combinedSectionId, subjectId, teacherId, day, period } = req.body;

  if (!schoolId || !classId || !combinedSectionId || !subjectId || !teacherId || !day || !period) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const transaction = await sequelize.transaction();

  try {
    console.log('Starting transaction for period assignment');

    const sectionName = combinedSectionId.split('-').slice(2).join('-');
    console.log('Section Name:', sectionName);

    // Check if the section already exists
    const existingSection = await Section.findOne({
      where: { schoolId, classInfoId: classId, sectionName },
      transaction
    });

    let sectionId;
    if (existingSection) {
      sectionId = existingSection.id;
      console.log('Existing section found with ID:', sectionId);
    } else {
      // Insert new section if it doesn't exist
      const newSection = await Section.create({
        schoolId,
        classInfoId: classId,
        sectionName,
        combinedSectionId
      }, { transaction });

      sectionId = newSection.id;
      console.log('New section created with ID:', sectionId);
    }

    // Insert the timetable entry
    const newEntry = await TimetableEntry.create({
      schoolId,
      classId,
      combinedSectionId,
      subjectId,
      teacherId,
      day,
      period
    }, { transaction });

    await transaction.commit();
    console.log('Transaction committed successfully');
    res.status(201).json(newEntry);
  } catch (error) {
    await transaction.rollback();
    console.error('Error during period assignment transaction:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
