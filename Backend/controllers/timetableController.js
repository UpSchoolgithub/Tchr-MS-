const { TimetableEntry, TeacherTimetable, Section, ClassInfo, School, Subject, Teacher } = require('../models');
const { Op } = require('sequelize');

// Controller function to assign a period
exports.assignPeriod = async (req, res) => {
  const { schoolId, classId, combinedSectionId, subjectId, teacherId, day, period, startTime, endTime } = req.body;

  // Validate required fields
  if (!schoolId || !classId || !combinedSectionId || !subjectId || !teacherId || !day || !period) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Ensure classId exists in ClassInfo table
    const classExists = await ClassInfo.findByPk(classId);
    if (!classExists) {
      return res.status(400).json({ error: 'Invalid classId. Class does not exist.' });
    }

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
    });

    // Respond with the newly created entry
    res.status(201).json(newEntry);
  } catch (error) {
    // Log the error and respond with a 500 status
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
    const assignments = await TimetableEntry.findAll({ where: { combinedSectionId } });

    // Respond with the assignments
    res.status(200).json(assignments);
  } catch (error) {
    // Log the error and respond with a 500 status
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to get timetable settings for a school
exports.getTimetableSettings = async (req, res) => {
  const { schoolId } = req.params;
  try {
    const timetableSettings = await TimetableSettings.findOne({ where: { schoolId } });
    console.log('Timetable Settings from DB:', timetableSettings); // Log the data
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
