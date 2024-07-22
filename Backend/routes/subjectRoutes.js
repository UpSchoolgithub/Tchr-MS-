const express = require('express');
const router = express.Router();
const { Subject, ClassInfo, Section } = require('../models');

// Route to get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.findAll();
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all subjects for a specific class and section
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects', async (req, res) => {
  try {
    const { schoolId, classId, sectionId } = req.params;
    const subjects = await Subject.findAll({
      where: {
        schoolId: schoolId,
        classInfoId: classId,
        sectionId: sectionId
      }
    });
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects', error });
  }
});

module.exports = router;
