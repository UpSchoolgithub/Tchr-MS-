const { TimetableEntry, TeacherTimetable, Section, ClassInfo, School, Subject, Teacher, TimetableSettings } = require('../models');
//const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

exports.assignPeriod = async (req, res) => {
  console.log("Received request to assign period:", req.body);

  const { schoolId, classId, sectionId, subjectId, teacherId, day, period, startTime, endTime } = req.body;

  // Validate that all necessary fields are provided
  if (!schoolId || !classId || !sectionId || !subjectId || !teacherId || !day || !period || !startTime || !endTime) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const transaction = await sequelize.transaction();

    // Check if the class exists
    const classExists = await ClassInfo.findByPk(classId, { transaction });
    if (!classExists) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Class does not exist.' });
    }

    // Check if a timetable entry already exists for this period
    const existingEntry = await TimetableEntry.findOne({
      where: { schoolId, classId, sectionId, day, period },
      transaction
    });

    if (existingEntry) {
      await transaction.rollback();
      return res.status(409).json({ error: 'Timetable entry for this period already exists.' });
    }

    // Create new timetable entry
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

    // Commit the transaction
    await transaction.commit();

    // Respond with the newly created entry
    return res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error assigning period:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};





// Controller function to get assignments for a section
exports.getAssignments = async (req, res) => {
  const { schoolId, classId, sectionId } = req.params;

  try {
    const assignments = await TimetableEntry.findAll({
      where: { schoolId, classId, sectionId },
      include: [
        { model: Teacher, attributes: ['name'] },
        { model: Subject, attributes: ['subjectName'] }
      ],
      order: [['day', 'ASC'], ['period', 'ASC']]
    });

    if (!assignments.length) {
      return res.status(404).json({ message: 'No assignments found for this section.' });
    }

    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
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

    res.status(200).json(timetableSettings);
  } catch (error) {
    console.error('Error fetching timetable settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to get a teacher's timetable
exports.getTeacherTimetable = async (req, res) => {
  const { teacherId } = req.params;

  try {
    // Fetch direct timetable entries where the teacher is assigned
    const directTimetable = await TimetableEntry.findAll({
      where: { teacherId },
      include: [
        { model: School, attributes: ['name'] },
        { model: ClassInfo, attributes: ['className'] },
        { model: Section, attributes: ['sectionName'] },
        { model: Subject, attributes: ['subjectName'] },
      ],
    });

    // Fetch timetable entries from TeacherTimetable where the teacher is assigned
    const teacherTimetableEntries = await TeacherTimetable.findAll({
      where: { teacherId },
      include: [
        {
          model: TimetableEntry,
          include: [
            { model: School, attributes: ['name'] },
            { model: ClassInfo, attributes: ['className'] },
            { model: Section, attributes: ['sectionName'] },
            { model: Subject, attributes: ['subjectName'] },
          ],
        },
      ],
    });

    const combinedTimetable = teacherTimetableEntries.map(entry => entry.TimetableEntry);

    // Combine direct and combined timetable entries
    const timetable = [...directTimetable, ...combinedTimetable];

    if (!timetable.length) {
      return res.status(404).json({ message: 'No timetable found for this teacher.' });
    }

    const formattedTimetable = timetable.map(entry => ({
      id: entry.id,
      day: entry.day,
      period: entry.period,
      time: `Period ${entry.period}`,
      schoolName: entry.School ? entry.School.name : 'Unknown School',
      className: entry.ClassInfo ? entry.ClassInfo.className : 'Unknown Class',
      sectionName: entry.Section ? entry.Section.sectionName : 'Unknown Section',
      subjectName: entry.Subject ? entry.Subject.subjectName : 'Unknown Subject',
      startTime: entry.startTime || null,
      endTime: entry.endTime || null,
    }));

    res.json(formattedTimetable);
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
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

    res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    res.status(200).json(entry);
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    res.status(200).json({ message: 'Timetable entry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to fetch sections by class and school
exports.getSectionsByClass = async (req, res) => {
  const { schoolId, classId } = req.params;

  try {
    // Find sections by schoolId and classId
    const sections = await Section.findAll({
      where: { schoolId, classInfoId: classId }
    });

    if (!sections.length) {
      return res.status(404).json({ message: 'No sections found for this class.' });
    }

    res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};