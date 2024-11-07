// routes/students.js
const express = require('express');
const router = express.Router();
const { Section, Student } = require('../models');

// Route to upload students
router.post('/sections/:combinedSectionId/students', async (req, res) => {
  const { combinedSectionId } = req.params;
  const { students } = req.body; // Expects an array of students in the request body

  try {
    // Find the section based on the combinedSectionId
    const section = await Section.findOne({ where: { combinedSectionId } });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Map and prepare student records for bulk insertion
    const studentRecords = students.map(student => ({
      rollNumber: student.rollNumber,
      name: student.name,
      studentEmail: student.studentEmail,
      studentPhoneNumber: student.studentPhoneNumber,
      parentName: student.parentName,
      parentPhoneNumber: student.parentPhoneNumber,
      parentPhoneNumber2: student.parentPhoneNumber2,
      parentEmail: student.parentEmail,
      sectionId: section.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Bulk create student records in the database
    await Student.bulkCreate(studentRecords);
    res.status(201).json({ message: 'Students uploaded successfully' });
  } catch (error) {
    console.error('Error uploading students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
