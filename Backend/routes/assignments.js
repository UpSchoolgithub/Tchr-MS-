// routes/assignments.js

const express = require('express');
const router = express.Router();
const { Assignment, Student } = require('../models');

// Get assignment results for a specific section
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/assignments', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const students = await Student.findAll({
      where: { sectionId },
      attributes: ['id', 'rollNumber', 'studentName']
    });

    const assignmentRecords = await Assignment.findAll({
      where: {
        studentId: students.map(student => student.id)
      }
    });

    res.json({ students, assignmentRecords });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Error fetching assignments' });
  }
});

// Save or update assignment results
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/assignments', async (req, res) => {
  const { assignmentData } = req.body;

  try {
    for (const assignment of assignmentData) {
      await Assignment.upsert({
        studentId: assignment.studentId,
        assignmentNumber: assignment.assignmentNumber,
        score: assignment.score
      });
    }

    res.json({ message: 'Assignments saved successfully' });
  } catch (error) {
    console.error('Error saving assignments:', error);
    res.status(500).json({ error: 'Error saving assignments' });
  }
});

module.exports = router;
