const express = require('express');
const router = express.Router();
const { ClassInfo, Section } = require('../models');

// Get all classes and sections for a school
router.get('/schools/:schoolId/classes', async (req, res) => {
  try {
    const classes = await ClassInfo.findAll({
      where: { schoolId: req.params.schoolId },
      include: [{ model: Section }]
    });
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Error fetching classes', error });
  }
});

module.exports = router;
