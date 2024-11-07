// Backend/routes/student.js
const express = require('express');
const router = express.Router();
const { Section, Student } = require('../models');

// Route to upload students
router.post('/sections/:sectionId/students', async (req, res) => {
  const { sectionId } = req.params;
  const { students } = req.body;

  try {
    const section = await Section.findOne({ where: { id: sectionId } });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const studentRecords = students.map(student => ({
      rollNumber: student['Roll Number'],
      name: student['Student Name'],
      studentEmail: student['Student Email'],
      studentPhoneNumber: student['Student Phone Number'],
      parentName: student['Parent Name'],
      parentPhoneNumber1: student['Parent Phone Number 1'],
      parentPhoneNumber2: student['Parent Phone Number 2 (optional)'],
      parentEmail: student['Parent Email'],
      sectionId: section.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Student.bulkCreate(studentRecords);
    res.status(201).json({ message: 'Students uploaded successfully' });
  } catch (error) {
    console.error('Error uploading students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
