const express = require('express');
const router = express.Router();
const { Section, Subject } = require('../models');

// Fetch sections for a specific classInfoId
router.get('/classes/:classInfoId/sections', async (req, res) => {
  const { classInfoId } = req.params;

  try {
    const sections = await Section.findAll({
      where: { classInfoId },
      include: [{ model: Subject, attributes: ['id', 'subjectName'] }] // Include subjects for each section
    });

    if (!sections) {
      return res.status(404).json({ message: 'No sections found for this class' });
    }

    res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Error fetching sections', error });
  }
});

module.exports = router;
