const { Assignment } = require('../models');

exports.recordAssignment = async (req, res) => {
  const { studentId, date, score } = req.body;

  try {
    const assignment = await Assignment.create({ studentId, date, score });
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error recording assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAssignments = async (req, res) => {
  const { studentId } = req.params;

  try {
    const assignments = await Assignment.findAll({ where: { studentId } });
    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
