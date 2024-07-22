const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

router.post('/api/students', async (req, res) => {
  try {
    const students = req.body;
    const savedStudents = await Student.bulkCreate(students, { updateOnDuplicate: ['rollNumber'] });
    res.status(201).json(savedStudents);
  } catch (error) {
    console.error('Error saving students:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
