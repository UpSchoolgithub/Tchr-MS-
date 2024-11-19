const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { Attendance, Student } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation Middleware
const validateAttendanceUpdate = [
  param('sectionId').isInt().withMessage('Section ID must be an integer'),
  body('attendanceData').isArray({ min: 1 }).withMessage('Attendance data must be an array'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Fetch attendance
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/attendance', async (req, res) => {
  const { sectionId } = req.params;
  const { month, year } = req.query;

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const studentsWithAttendance = await Student.findAll({
      where: { sectionId },
      include: [
        {
          model: Attendance,
          where: { date: { [Op.between]: [startDate, endDate] } },
          required: false,
        },
      ],
    });

    res.json(studentsWithAttendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update attendance
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/attendance', validateAttendanceUpdate, async (req, res) => {
  const { attendanceData } = req.body;

  try {
    await Attendance.bulkCreate(attendanceData, { updateOnDuplicate: ['status'] });
    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
