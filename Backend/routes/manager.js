const express = require('express');
const Manager = require('../models/Manager');
const router = express.Router();

// Fetch all managers
router.get('/', async (req, res) => {
  try {
    const managers = await Manager.findAll();
    res.json(managers);
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Create a new manager
router.post('/', async (req, res) => {
  const { name, email, phoneNumber, password } = req.body;
  try {
    const newManager = await Manager.create({ name, email, phoneNumber, password });
    res.status(201).json(newManager);
  } catch (error) {
    console.error('Error creating manager:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
