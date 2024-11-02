// controllers/teacherController.js

const { TimetableEntry, School, ClassInfo, Section, Subject, Teacher } = require('../models');

exports.getTeacherTimetable = async (req, res) => {
  const { teacherId } = req.params;

  try {
    const timetable = await TimetableEntry.findAll({
      where: { teacherId },
      include: [
        { model: School, attributes: ['name'], as: 'school' },
        { model: ClassInfo, attributes: ['className'], as: 'classInfo' },
        { model: Section, attributes: ['sectionName'], as: 'section' },
        { model: Subject, attributes: ['subjectName'], as: 'subject' }
      ],
      order: [['day', 'ASC'], ['period', 'ASC']]
    });

    const formattedTimetable = timetable.map(entry => ({
      id: entry.id,
      day: entry.day,
      period: entry.period,
      schoolName: entry.school ? entry.school.name : 'N/A',
      className: entry.classInfo ? entry.classInfo.className : 'N/A',
      sectionName: entry.section ? entry.section.sectionName : 'N/A',
      subjectName: entry.subject ? entry.subject.subjectName : 'N/A',
      startTime: entry.startTime,
      endTime: entry.endTime
    }));

    res.status(200).json(formattedTimetable);
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
