// routes/students.js
const express = require('express');
const router = express.Router();
const { Section, Student } = require('../models');

// Route to upload students
router.post('/sections/:combinedSectionId/students', async (req, res) => {
  const { combinedSectionId } = req.params;
  const { students } = req.body;

  try {
    const section = await Section.findOne({ where: { combinedSectionId } });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Fetch existing roll numbers for the section
    const existingRollNumbers = await Student.findAll({
      attributes: ['rollNumber'],
      where: { sectionId: section.id },
      raw: true,
    });
    const existingRollNumbersSet = new Set(existingRollNumbers.map(student => student.rollNumber));

    // Prepare student records with unique roll numbers within the section
    const studentRecords = students.map(student => {
      let rollNumber = student['Roll Number'];
      while (existingRollNumbersSet.has(rollNumber)) {
        rollNumber++;
      }
      existingRollNumbersSet.add(rollNumber);

      return {
        name: student['Student Name'],
        rollNumber,
        studentEmail: student['Student Email'],
        studentPhoneNumber: student['Student Phone Number'],
        parentName: student['Parent Name'],
        parentPhoneNumber: student['Parent Phone Number'],
        parentPhoneNumber2: student['Parent Phone Number 2 (optional)'],
        parentEmail: student['Parent Email'],
        sectionId: section.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await Student.bulkCreate(studentRecords);
    res.status(201).json({ message: 'Students uploaded successfully' });
  } catch (error) {
    console.error('Error uploading students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
