const express = require('express');
const router = express.Router();
const { Teacher, School } = require('../models'); // Adjust the path as necessary

// Route to get all teachers for a specific school
router.get('/schools/:schoolId/teachers', async (req, res) => {
  const { schoolId } = req.params;
  try {
    const school = await School.findByPk(schoolId, {
      include: [{
        model: Teacher,
        through: { attributes: [] }
      }]
    });

    if (!school) {
      return res.status(404).send({ message: 'School not found' });
    }

    const teachers = school.Teachers;
    res.status(200).json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).send({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
