// teacherController.js

const { TimetableEntry, School, Subject } = require('../models');

const getTeacherAssignments = async (req, res) => {
    const { teacherId } = req.params;
  
    try {
      // Fetch assignments including school, class, section, and timings
      const assignments = await TimetableEntry.findAll({
        where: { teacherId },
        include: [
          { model: School, attributes: ['name'] },
          { model: ClassInfo, attributes: ['name'] },
          { model: Section, attributes: ['name'] },
          { model: Subject, attributes: ['subjectName'] }
        ],
        attributes: ['day', 'period', 'startTime', 'endTime']
      });
  
      const formattedAssignments = assignments.map(assignment => ({
        schoolName: assignment.School?.name || 'N/A',
        className: assignment.ClassInfo?.name || 'N/A',
        sectionName: assignment.Section?.name || 'N/A',
        day: assignment.day,
        period: assignment.period,
        subjectName: assignment.Subject?.subjectName || 'N/A',
        startTime: assignment.startTime,
        endTime: assignment.endTime,
      }));
  
      res.json(formattedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error); // Log the actual error on the server
      res.status(500).json({ message: 'Failed to fetch assignments' });
    }
  };
  
  
  

module.exports = {
  getTeacherAssignments
};
