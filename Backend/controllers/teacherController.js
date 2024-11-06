// teacherController.js

const { TimetableEntry, School, Subject } = require('../models');

const getTeacherAssignments = async (req, res) => {
  const { teacherId } = req.params;

  try {
    const assignments = await TimetableEntry.findAll({
      where: { teacherId },
      include: [
        { model: School, attributes: ['name'] },
        { model: Subject, attributes: ['subjectName'] },
      ],
    });

    const formattedAssignments = assignments.map(assignment => ({
      schoolName: assignment.School.name,
      day: assignment.day,
      period: assignment.period,
      subjectName: assignment.Subject.subjectName,
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
