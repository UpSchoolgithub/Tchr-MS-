const express = require('express');
const router = express.Router();
const { Subject, ClassInfo, Section } = require('../models');

// Get subjects for a specific school, class, and section
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects', async (req, res) => {
  const { schoolId, classId, sectionId } = req.params;
  try {
    const subjects = await Subject.findAll({
      include: [{
        model: ClassInfo,
        where: { id: classId, schoolId: schoolId },
        include: [{
          model: Section,
          where: { id: sectionId }
        }]
      }]
    });

    if (!subjects.length) {
      return res.status(404).json({ message: 'No subjects found for this section, class, and school.' });
    }

    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
