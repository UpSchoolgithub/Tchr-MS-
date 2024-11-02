const { TimetableEntry, TeacherTimetable, Section, ClassInfo, School, Subject, Teacher, TimetableSettings } = require('../models');
const sequelize = require('../config/db');  // Import sequelize for transactions

// Controller function to assign a period
exports.assignPeriod = async (req, res) => {
  console.log("Received request to assign period:", req.body);

  const { schoolId, classId, sectionId, subjectId, teacherId, day, period, startTime, endTime } = req.body;

  if (!schoolId || !classId || !sectionId || !subjectId || !teacherId || !day || !period || !startTime || !endTime) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const transaction = await sequelize.transaction();  // Start transaction
  try {
    console.log("Transaction started...");

    const classExists = await ClassInfo.findByPk(classId, { transaction });
    if (!classExists) {
      console.log("Class does not exist with classId:", classId);
      await transaction.rollback();
      return res.status(400).json({ error: 'Class does not exist.' });
    }

    const existingEntry = await TimetableEntry.findOne({
      where: { schoolId, classId, sectionId, day, period },
      transaction
    });

    if (existingEntry) {
      console.log("Timetable entry already exists for this period.");
      await transaction.rollback();
      return res.status(409).json({ error: 'Timetable entry already exists.' });
    }

    const newEntry = await TimetableEntry.create({
      schoolId,
      classId,
      sectionId,
      subjectId,
      teacherId,
      day,
      period,
      startTime,
      endTime
    }, { transaction });

    console.log("New timetable entry created:", newEntry);

    await transaction.commit();
    console.log("Transaction committed.");

    return res.status(201).json(newEntry);
  } catch (error) {
    await transaction.rollback();
    console.error("Error during period assignment:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to get assignments for a section
exports.getAssignments = async (req, res) => {
  // Log the start of the function
  console.log('Entering getAssignments function');

  // Log request params
  console.log('Request params:', req.params);

  const { schoolId, classId, sectionId } = req.params;

  // Log extracted parameters
  console.log('Extracted parameters:', { schoolId, classId, sectionId });

  // Check if any required parameters are missing
  if (!schoolId || !classId || !sectionId) {
    console.error('Missing parameters:', { schoolId, classId, sectionId });
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Log the query that will be executed
    console.log('Executing findAll query for TimetableEntry:', {
      where: { schoolId, classId, sectionId }
    });

    const assignments = await TimetableEntry.findAll({
      where: { schoolId, classId, sectionId },
      include: [
        { model: Teacher, attributes: ['name'] },
        { model: Subject, attributes: ['subjectName'] }
      ],
      order: [['day', 'ASC'], ['period', 'ASC']]
    });

    // Log the result of the findAll query
    console.log('Assignments fetched from database:', assignments);

    // Check if no assignments were found
    if (!assignments.length) {
      console.log('No assignments found for this section:', { schoolId, classId, sectionId });
      return res.status(404).json({ message: 'No assignments found for this section.' });
    }

    // Log success and return the response
    console.log('Returning assignments:', assignments);
    return res.status(200).json(assignments);
  } catch (error) {
    // Log the error message and stack trace
    console.error('Error occurred during findAll query:', error.message);
    console.error('Error stack trace:', error.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
};



// Controller function to get timetable settings for a school
exports.getTimetableSettings = async (req, res) => {
  const { schoolId } = req.params;
  try {
    const timetableSettings = await TimetableSettings.findOne({ where: { schoolId } });

    if (!timetableSettings) {
      return res.status(404).json({ error: 'Timetable settings not found.' });
    }

    return res.status(200).json(timetableSettings);
  } catch (error) {
    console.error('Error fetching timetable settings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to get a teacher's timetable

 // Final resolved code without conflict markers
exports.getTeacherTimetable = async (req, res) => {
  const { teacherId } = req.params;
  console.log('Fetching timetable for teacherId:', teacherId);

  try {
    const timetable = await TimetableEntry.findAll({
      where: { teacherId },
      include: [
        { model: School, attributes: ['name'] },
        { model: ClassInfo, attributes: ['className'] },
        { model: Section, attributes: ['sectionName'] },
        { model: Subject, attributes: ['subjectName'] },
      ],
      order: [['day', 'ASC'], ['period', 'ASC']],
    });

    if (!timetable.length) {
      return res.status(404).json({ message: 'No timetable found for this teacher.' });
    }

    return res.status(200).json(timetable);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// Controller function to get all sections for a given class
exports.getSectionsByClassId = async (req, res) => {
  const { schoolId, classId } = req.params;

  try {
    const sections = await Section.findAll({
      where: { classInfoId: classId, schoolId }
    });

    if (!sections.length) {
      return res.status(404).json({ message: 'No sections found for this class.' });
    }

    return res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to update an existing timetable entry
exports.updateTimetableEntry = async (req, res) => {
  const { id } = req.params;
  const { subjectId, teacherId, day, period, startTime, endTime } = req.body;

  try {
    const entry = await TimetableEntry.findByPk(id);

    if (!entry) {
      return res.status(404).json({ error: 'Timetable entry not found.' });
    }

    entry.subjectId = subjectId || entry.subjectId;
    entry.teacherId = teacherId || entry.teacherId;
    entry.day = day || entry.day;
    entry.period = period || entry.period;
    entry.startTime = startTime || entry.startTime;
    entry.endTime = endTime || entry.endTime;

    await entry.save();
    return res.status(200).json(entry);
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to delete a timetable entry
exports.deleteTimetableEntry = async (req, res) => {
  const { id } = req.params;

  try {
    const entry = await TimetableEntry.findByPk(id);

    if (!entry) {
      return res.status(404).json({ error: 'Timetable entry not found.' });
    }

    await entry.destroy();
    return res.status(200).json({ message: 'Timetable entry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to fetch sections by class and school
exports.getSectionsByClass = async (req, res) => {
  const { schoolId, classId } = req.params;

  try {
    const sections = await Section.findAll({
      where: { schoolId, classInfoId: classId }
    });

    if (!sections.length) {
      return res.status(404).json({ message: 'No sections found for this class.' });
    }

    return res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

