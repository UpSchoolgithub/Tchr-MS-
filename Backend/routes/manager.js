const express = require('express');
const { Manager, School } = require('../models');
const bcrypt = require('bcrypt');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const authenticateManager = require('../middleware/authenticateManager');

// Fetch all managers (protected route)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const managers = await Manager.findAll({
      include: {
        model: School,
        attributes: ['id', 'name'],
        through: { attributes: [] } // Exclude the join table fields like createdAt, updatedAt
      }
    });
    res.json(managers);
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Fetch all schools (you might want to protect this route)
router.get('/schools', async (req, res) => {
  try {
    const schools = await School.findAll();
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Fetch specific manager by ID (protected route)
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const manager = await Manager.findByPk(id, { 
      include: { model: School, attributes: ['id', 'name'] }
    });
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    res.json(manager);
  } catch (error) {
    console.error('Error fetching manager:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Create a new manager (only allowed for SuperManagers)
router.post('/', authenticateToken, async (req, res) => {
  const { name, email, phoneNumber, password, schoolIds } = req.body;

  try {
    // Check if email already exists (ensure email is unique in the database schema)
    const existingManager = await Manager.findOne({ where: { email } });
    if (existingManager) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the manager in the database
    const newManager = await Manager.create({ name, email, phoneNumber, password: hashedPassword });

    // Assign schools if provided
    if (schoolIds && schoolIds.length > 0) {
      const schools = await School.findAll({ where: { id: schoolIds } });
      await newManager.setSchools(schools);
    }

    // Send response without the password
    const { id, name: managerName, email: managerEmail, phoneNumber: managerPhone } = newManager;
    res.status(201).json({ id, name: managerName, email: managerEmail, phoneNumber: managerPhone });

  } catch (error) {
    console.error('Error creating manager:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update a manager
router.put('/:id', authenticateToken, async (req, res) => {
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
router.delete('/:id', authenticateToken, async (req, res) => {
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
  const { id } = req.params;  // Manager ID from request params

  try {
    // Fetch the manager along with associated schools
    const manager = await Manager.findByPk(id, {
      include: {
        model: School,  // Include the associated schools
        through: { attributes: [] }  // Exclude the intermediate table attributes
      }
    });

    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    // Send back the schools associated with the manager
    res.json(manager.Schools);
  } catch (error) {
    console.error('Error fetching schools for manager:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


module.exports = router;
