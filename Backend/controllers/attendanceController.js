const { Attendance } = require('../models');

exports.recordAttendance = async (req, res) => {
  const { studentId, date, status } = req.body;

  try {
    const attendance = await Attendance.create({ studentId, date, status });
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAttendance = async (req, res) => {
  const { studentId } = req.params;

  try {
    const attendance = await Attendance.findAll({ where: { studentId } });
    res.status(200).json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
