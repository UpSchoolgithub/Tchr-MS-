const TimetableEntry = require('../models/TimetableEntry');
const Section = require('../models/Section');
const Period = require('../models/Period');

const assignPeriod = async (req, res) => {
    const { schoolId, classId, sectionId, subjectId, teacherId, day, period } = req.body;
    try {
        const section = await Section.findByPk(sectionId);
        if (!section) {
            return res.status(400).json({ message: 'Invalid sectionId' });
        }

        const newPeriod = await Period.create({
            schoolId,
            classId,
            sectionId,
            subjectId,
            teacherId,
            day,
            period
        });

        res.status(201).json(newPeriod);
    } catch (error) {
        console.error('Error assigning period:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getAssignments = async (req, res) => {
    const { schoolId } = req.params;
    try {
        const assignments = await Period.findAll({ where: { schoolId } });
        res.status(200).json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = {
  assignPeriod,
  getAssignments
};
