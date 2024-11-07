// teacherController.js

const { TimetableEntry, School, ClassInfo, Section, Subject } = require('../models');

const getTeacherAssignments = async (req, res) => {
  const { teacherId } = req.params;

  try {
    // Fetch assignments including all necessary associations
    const assignments = await TimetableEntry.findAll({
      where: { teacherId },
      include: [
        { model: School, attributes: ['name'] },
        { model: ClassInfo, attributes: ['className'] },
        { model: Section, attributes: ['sectionName'] },
        { model: Subject, attributes: ['subjectName'] }
      ],
      attributes: ['day', 'period', 'startTime', 'endTime']
    });

    // Log assignments to verify data structure
    console.log("Assignments fetched:", assignments);

    // Format the data as needed for frontend
    const formattedAssignments = assignments.map(assignment => ({
      schoolName: assignment.School.name,
      className: assignment.ClassInfo.className,
      sectionName: assignment.Section.sectionName,
      day: assignment.day,
      period: assignment.period,
      subjectName: assignment.Subject.subjectName,
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
