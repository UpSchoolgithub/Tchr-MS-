const express = require('express');
const router = express.Router();
const { ClassInfo, Section, Subject } = require('../models');

// Get all sections for a specific class in a school
router.get('/classes/:classId/sections', async (req, res) => {
  try {
    const sections = await Section.findAll({
      where: { classId: req.params.classId },
      include: [{ model: Subject }]  // If sections include subjects
    });
    res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Error fetching sections', error });
  }
});

module.exports = router;
