const { TimetableEntry, TeacherTimetable, Section, ClassInfo, School, Subject, Teacher } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db'); // Ensure you adjust this to match your actual path

// Controller function to assign a period
exports.assignPeriod = async (req, res) => {
  console.log('Request Body:', req.body);

  const { schoolId, classId, combinedSectionId, subjectId, teacherId, day, period, startTime, endTime } = req.body;

  // Validate required fields
  if (!schoolId || !classId || !combinedSectionId || !subjectId || !teacherId || !day || !period || !startTime || !endTime) {
    return res.status(400).json({ error: 'All fields, including startTime and endTime, are required.' });
  }

  const transaction = await sequelize.transaction();

  try {
    // Check if classId exists in ClassInfo table
    const classExists = await ClassInfo.findByPk(classId);
    
    if (!classExists) {
      // If classId doesn't exist, rollback and return an error
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid classId. Class does not exist.' });
    }

    // Check if a timetable entry already exists to prevent duplicates
    const existingEntry = await TimetableEntry.findOne({
      where: { schoolId, classId, combinedSectionId, day, period }
    });

    if (existingEntry) {
      await transaction.rollback();
      return res.status(409).json({ error: 'A timetable entry for this period already exists.' });
    }

    // Create a new timetable entry
    const newEntry = await TimetableEntry.create({
      schoolId,
      classId,
      combinedSectionId,
      subjectId,
      teacherId,
      day,
      period,
      startTime,
      endTime
    }, { transaction });

    // Extract sectionName from combinedSectionId (e.g., "A" from "18-1-A")
    const sectionName = combinedSectionId.split('-').slice(2).join('-');

    // Find or create the section based on combinedSectionId
    await Section.findOrCreate({
      where: { schoolId, classInfoId: classId, sectionName },
      defaults: { combinedSectionId },
      transaction
    });

    // Create or update TeacherTimetable entry
    await TeacherTimetable.create({
      teacherId,
      schoolId,
      combinedSectionId,
      subjectId,
      day,
      period,
      startTime,
      endTime
    }, { transaction });

    // Commit the transaction
    await transaction.commit();

    // Respond with the newly created entry
    res.status(201).json(newEntry);
  } catch (error) {
    // Rollback the transaction in case of any errors
    await transaction.rollback();

    console.error('Error creating timetable entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to get assignments for a section
exports.getAssignments = async (req, res) => {
  const { schoolId, classId, sectionName } = req.params;
  const combinedSectionId = `${schoolId}-${classId}-${sectionName}`;

  try {
    // Fetch all assignments for the given combinedSectionId
    const assignments = await Assignment.findAll({
      where: { combinedSectionId },
      order: [['createdAt', 'DESC']], // Order by the latest entries
      limit: 10 // Limit the result set, adjust as per your requirement
    });

    if (!assignments.length) {
      return res.status(404).json({ message: 'No assignments found for this section.' });
    }

    // Respond with the assignments
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

// Controller function to get a comprehensive timetable for a teacher
exports.getTeacherTimetable = async (req, res) => {
  const { teacherId } = req.params;

  try {
    // Fetch all timetable entries where the teacher is directly assigned
    const directTimetable = await TimetableEntry.findAll({
      where: { teacherId },
      include: [
        { model: School, attributes: ['name'] },
        { model: ClassInfo, attributes: ['className'] }, // Use className instead of name
        { model: Section, attributes: ['combinedSectionId', 'sectionName'] },
        { model: Subject, attributes: ['subjectName'] },
      ],
    });

    // Fetch all timetable entries from TeacherTimetable where the teacher is assigned
    const teacherTimetableEntries = await TeacherTimetable.findAll({
      where: { teacherId },
      include: [
        {
          model: TimetableEntry,
          include: [
            { model: School, attributes: ['name'] },
            { model: ClassInfo, attributes: ['className'] }, // Use className instead of name
            { model: Section, attributes: ['combinedSectionId', 'sectionName'] },
            { model: Subject, attributes: ['subjectName'] },
          ],
        },
      ],
    });

    // Extract TimetableEntry instances from TeacherTimetable
    const combinedTimetable = teacherTimetableEntries.map(entry => entry.TimetableEntry);

    // Combine both direct and combined timetable entries
    const timetable = [...directTimetable, ...combinedTimetable];

    if (!timetable.length) {
      return res.status(404).json({ message: 'No timetable found for this teacher.' });
    }

    // Remove duplicates (if any)
    const uniqueTimetable = [];
    const seen = new Set();
    for (const entry of timetable) {
      const identifier = `${entry.schoolId}-${entry.classId}-${entry.combinedSectionId}-${entry.day}-${entry.period}`;
      if (!seen.has(identifier)) {
        seen.add(identifier);
        uniqueTimetable.push(entry);
      }
    }

    // Format the timetable data
    const formattedTimetable = uniqueTimetable.map(entry => ({
      id: entry.id,
      day: entry.day,
      period: entry.period,
      time: `Period ${entry.period}`,
      schoolName: entry.School ? entry.School.name : 'Unknown School',
      className: entry.ClassInfo ? entry.ClassInfo.className : 'Unknown Class', // Use className
      sectionName: entry.Section ? entry.Section.sectionName : 'Unknown Section',
      combinedSectionId: entry.Section ? entry.Section.combinedSectionId : 'Unknown Section ID',
      subjectName: entry.Subject ? entry.Subject.subjectName : 'Unknown Subject',
      startTime: entry.startTime || null,
      endTime: entry.endTime || null,
    }));

    res.json(formattedTimetable);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
