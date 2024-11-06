// teacherController.js

const { TimetableEntry, School, Subject, ClassInfo, Section } = require('../models');

const getTeacherAssignments = async (req, res) => {
    const { teacherId } = req.params;
  
    try {
      // Fetch assignments including school, subject, class, and section details
      const assignments = await TimetableEntry.findAll({
        where: { teacherId },
        include: [
          { model: School, attributes: ['name'] },
          { model: Subject, attributes: ['subjectName'] },
          { model: ClassInfo, attributes: ['name'] },
          { model: Section, attributes: ['name'] }
        ],
        attributes: ['day', 'period', 'startTime', 'endTime']
      });
  
      const formattedAssignments = assignments.map(assignment => ({
        schoolName: assignment.School?.name || 'N/A',         // Using optional chaining
        className: assignment.ClassInfo?.name || 'N/A',       // Using optional chaining
        sectionName: assignment.Section?.name || 'N/A',       // Using optional chaining
        day: assignment.day,
        period: assignment.period,
        subjectName: assignment.Subject?.subjectName || 'N/A', // Using optional chaining
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
