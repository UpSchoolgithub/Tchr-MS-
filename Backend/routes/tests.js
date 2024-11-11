// routes/tests.js

const express = require('express');
const router = express.Router();
const { Test, Student } = require('../models');

// Get test results for a specific section
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/tests', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const students = await Student.findAll({
      where: { sectionId },
      attributes: ['id', 'rollNumber', 'studentName']
    });

    const testRecords = await Test.findAll({
      where: {
        studentId: students.map(student => student.id)
      }
    });

    res.json({ students, testRecords });
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ error: 'Error fetching test results' });
  }
});

// Save or update test results
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/tests', async (req, res) => {
  const { testData } = req.body;

  try {
    for (const test of testData) {
      await Test.upsert({
        studentId: test.studentId,
        testNumber: test.testNumber,
        score: test.score
      });
    }

    res.json({ message: 'Test results saved successfully' });
  } catch (error) {
    console.error('Error saving test results:', error);
    res.status(500).json({ error: 'Error saving test results' });
  }
});

module.exports = router;
