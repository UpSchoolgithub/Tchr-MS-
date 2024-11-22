// teacherController.js

const { TimetableEntry, School, ClassInfo, Section, Subject } = require('../models');

const getTeacherAssignments = async (req, res) => {
  const { teacherId } = req.params;

  try {
    // Fetch assignments including all necessary associations
    const assignments = await TimetableEntry.findAll({
      where: { teacherId },
      include: [
        { model: School, attributes: ['name','id'] },
        { model: ClassInfo, attributes: ['className','id'] },
        { model: Section, attributes: ['sectionName', 'id'] },
        { model: Subject, attributes: ['subjectName','id'] }
      ],
      attributes: ['day', 'period', 'startTime', 'endTime']
    });

    // Log assignments to verify data structure
    console.log("Assignments fetched:", assignments);

    // Format the data as needed for frontend
    const formattedAssignments = assignments.map(assignment => ({
      schoolId: assignment.School.id, // Add schoolId
      schoolName: assignment.School.name,
      classId: assignment.ClassInfo.id, // Add classId
      className: assignment.ClassInfo.className,
      sectionName: assignment.Section.sectionName,
      sectionId: assignment.Section.id, // Ensure sectionId is included
      day: assignment.day,
      period: assignment.period,
      subjectId: assignment.Subject.id, // Add subjectId
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
