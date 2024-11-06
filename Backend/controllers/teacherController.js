// teacherController.js
const { TimetableEntry, School, Subject, ClassInfo, Section } = require('../models');

const getTeacherAssignments = async (req, res) => {
    const { teacherId } = req.params;

    try {
        // Fetch assignments including all necessary details
        const assignments = await TimetableEntry.findAll({
            where: { teacherId },
            include: [
                { model: School, attributes: ['name'] },
                { model: Subject, attributes: ['subjectName'] },
                { model: ClassInfo, attributes: ['className'] },
                { model: Section, attributes: ['section_name'] } // Use actual column name here
            ],
            attributes: ['day', 'period', 'startTime', 'endTime']
        });

        const formattedAssignments = assignments.map(assignment => ({
            schoolName: assignment.School.name,
            className: assignment.ClassInfo.className,
            sectionName: assignment.Section.section_name, // Update this if column name differs
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
