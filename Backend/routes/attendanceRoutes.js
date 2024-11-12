// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { Attendance, Student } = require('../models');
const { Op } = require('sequelize');

// Get attendance for a specific month and section
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/attendance', async (req, res) => {
  const { sectionId } = req.params;
  const { month, year } = req.query;

  try {
    // Fetch students in the section
    const students = await Student.findAll({ where: { sectionId } });
    const studentIds = students.map(student => student.id);

    // Fetch attendance for the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const attendanceRecords = await Attendance.findAll({
      where: {
        studentId: studentIds,
        date: { [Op.between]: [startDate, endDate] },
      }
    });

    res.json({ students, attendanceRecords });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update attendance
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/attendance', async (req, res) => {
    const { sectionId } = req.params;
    const { attendanceData } = req.body;
  
    try {
      // Bulk upsert attendance records, setting 'status' as 'A' or 'P'
      await Attendance.bulkCreate(attendanceData, { updateOnDuplicate: ['status'] });
      res.json({ message: 'Attendance updated successfully' });
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

module.exports = router;
