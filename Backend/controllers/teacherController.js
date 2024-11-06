// teacherController.js
const { TimetableEntry, School, Subject, ClassInfo, Section } = require('../models');

const getTeacherAssignments = async (req, res) => {
    const { teacherId } = req.params;
  
    try {
      const assignments = await TimetableEntry.findAll({
        where: { teacherId },
        include: [
          { model: School, attributes: ['name'], as: 'school' },
          { model: ClassInfo, attributes: ['className'], as: 'classInfo' },
          { model: Section, attributes: ['sectionName'], as: 'section' },
          { model: Subject, attributes: ['subjectName'], as: 'subject' }
        ],
        attributes: ['id', 'day', 'period', 'startTime', 'endTime']
      });
  
      const formattedAssignments = assignments.map(assignment => ({
        schoolName: assignment.school.name,
        className: assignment.classInfo.className,
        sectionName: assignment.section.sectionName,
        subjectName: assignment.subject.subjectName,
        day: assignment.day,
        period: assignment.period,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
      }));
  
      res.json(formattedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ message: 'Failed to fetch assignments' });
    }
  };
  

module.exports = {
    getTeacherAssignments
};
