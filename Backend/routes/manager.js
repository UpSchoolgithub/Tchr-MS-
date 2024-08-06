const express = require('express');
const { Manager, School } = require('../models');
const bcrypt = require('bcrypt');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const authenticateManager = require('../middleware/authenticateManager');

// Fetch all managers
router.get('/', async (req, res) => {
  try {
    const managers = await Manager.findAll({ include: School });
    res.json(managers);
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Fetch all schools
router.get('/schools', async (req, res) => {
  try {
    const schools = await School.findAll();
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Fetch specific manager by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const manager = await Manager.findByPk(id, { include: School });
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    res.json(manager);
  } catch (error) {
    console.error('Error fetching manager:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Create a new manager
router.post('/', async (req, res) => {
  const { name, email, phoneNumber, password, schoolIds } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newManager = await Manager.create({ name, email, phoneNumber, password: hashedPassword });
    if (schoolIds && schoolIds.length > 0) {
      const schools = await School.findAll({ where: { id: schoolIds } });
      await newManager.setSchools(schools);
    }
    res.status(201).json(newManager);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(e => e.message);
      res.status(400).json({ message: 'Validation error', errors });
    } else {
      console.error('Error creating manager:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
});

// Update a manager
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phoneNumber, password, schoolIds } = req.body;
  try {
    const manager = await Manager.findByPk(id);
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    const updatedData = { name, email, phoneNumber };
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedData.password = hashedPassword;
    }

    await manager.update(updatedData);

    if (schoolIds && schoolIds.length > 0) {
      const schools = await School.findAll({ where: { id: schoolIds } });
      await manager.setSchools(schools);
    }

    res.json({ message: 'Manager updated successfully', manager });
  } catch (error) {
    console.error('Error updating manager:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete a manager
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const manager = await Manager.findByPk(id);
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    await manager.destroy();
    res.json({ message: 'Manager deleted successfully' });
  } catch (error) {
    console.error('Error deleting manager:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Fetch schools tagged to a specific manager
router.get('/:id/schools', authenticateManager, async (req, res) => {
  const { id } = req.params;
  try {
    const manager = await Manager.findByPk(id, { include: School });
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    res.json(manager.Schools);
  } catch (error) {
    console.error('Error fetching schools for manager:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
