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

    const studentRecords = students.map(student => ({
      name: student.name,
      sectionId: section.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await Student.bulkCreate(studentRecords);
    res.status(201).json({ message: 'Students uploaded successfully' });
  } catch (error) {
    console.error('Error uploading students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
