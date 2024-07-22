const express = require('express');
const router = express.Router();
const { Teacher, School } = require('../models'); // Adjust the path if needed
const bcrypt = require('bcrypt');
const authenticateToken = require('../middleware/authenticateToken');

// Create a new teacher
router.post('/', authenticateToken, async (req, res) => {
  const { name, email, phone, password, schoolIds } = req.body;
  try {
    console.log("Received request body:", req.body);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashedPassword);

    const newTeacher = await Teacher.create({ name, email, phone, password: hashedPassword });
    console.log("New teacher created:", newTeacher);

    if (schoolIds && schoolIds.length > 0) {
      const schools = await School.findAll({ where: { id: schoolIds } });
      console.log("Found schools:", schools);

      await newTeacher.setSchools(schools);
      console.log("Assigned schools to teacher");
    }

    res.status(201).json(newTeacher);
  } catch (error) {
    console.error('Error creating teacher:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Unique constraint error', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
});

// Fetch all teachers
router.get('/', async (req, res) => {
    try {
      const teachers = await Teacher.findAll({
        include: {
          model: School,
          through: { attributes: [] } // This removes the join table attributes
        }
      });
      res.json(teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  // Fetch a single teacher
router.get('/:id', async (req, res) => {
    try {
      const teacher = await Teacher.findByPk(req.params.id, {
        include: {
          model: School,
          through: { attributes: [] } // This removes the join table attributes
        }
      });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      res.json(teacher);
    } catch (error) {
      console.error('Error fetching teacher:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  // Update a teacher
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, password, schoolIds } = req.body;
    try {
      const teacher = await Teacher.findByPk(id);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
  
      const updatedData = { name, email, phone };
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updatedData.password = hashedPassword;
      }
  
      await teacher.update(updatedData);
  
      if (schoolIds && schoolIds.length > 0) {
        const schools = await School.findAll({ where: { id: schoolIds } });
        await teacher.setSchools(schools);
      }
  
      res.json({ message: 'Teacher updated successfully', teacher });
    } catch (error) {
      console.error('Error updating teacher:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
  
  // Delete a teacher
  router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const teacher = await Teacher.findByPk(id);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      await teacher.destroy();
      res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
      console.error('Error deleting teacher:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
  
module.exports = router;
