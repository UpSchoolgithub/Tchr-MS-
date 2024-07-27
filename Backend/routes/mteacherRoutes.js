const express = require('express');
const { Teacher, Manager, School } = require('../models');
const router = express.Router();
const authenticateManager = require('../middleware/authenticateManager');
const authenticateToken = require('../middleware/authenticateToken');

// Fetch all teachers for the logged-in manager
router.get('/', authenticateManager, async (req, res) => {
  try {
    const managerId = req.user.id;
    const teachers = await Teacher.findAll({ where: { ManagerId: managerId } });
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Create a new teacher
router.post('/', authenticateManager, async (req, res) => {
  const { name, email, phoneNumber } = req.body;
  try {
    const managerId = req.user.id;
    const newTeacher = await Teacher.create({ name, email, phoneNumber, ManagerId: managerId });
    res.status(201).json(newTeacher);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(e => e.message);
      res.status(400).json({ message: 'Validation error', errors });
    } else {
      console.error('Error creating teacher:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
});

// Get all teachers for a specific school
router.get('/schools/:schoolId/teachers', async (req, res) => {
    const schoolId = req.params.schoolId;
    try {
      const school = await School.findByPk(schoolId, {
        include: [{
          model: Teacher,
          through: { attributes: [] } // This removes the join table attributes
        }]
      });
      if (!school) {
        return res.status(404).json({ message: 'School not found' });
      }
      res.status(200).json(school.Teachers);
    } catch (error) {
      console.error(`Error fetching teachers for schoolId=${schoolId}:`, error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

module.exports = router;
