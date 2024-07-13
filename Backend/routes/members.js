const express = require('express');
const router = express.Router();
const Member = require('../models/Members');

// Get all members for a specific school
router.get('/', async (req, res) => {
  const { schoolId } = req.query;
  if (!schoolId) {
    return res.status(400).json({ message: 'schoolId is required' });
  }
  try {
    const members = await Member.findAll({ where: { schoolId } });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
});

// Add a new member
router.post('/', async (req, res) => {
  const { name, email, phoneNumber, location, schoolId } = req.body;
  
  // Log the received data
  console.log('Received data:', { name, email, phoneNumber, location, schoolId });
  
  // Check for missing fields
  if (!name || !email || !phoneNumber || !location || !schoolId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newMember = await Member.create({ name, email, phoneNumber, location, schoolId });
    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error adding member:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'A member with the same email or phone number already exists within the same school' });
    } else if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error adding member', error: error.message });
  }
});

// Get a specific member by ID
router.get('/:id', async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching member', error: error.message });
  }
});

// Update a member
router.put('/:id', async (req, res) => {
  const { name, email, phoneNumber, location, schoolId } = req.body;
  
  // Check for missing fields
  if (!name || !email || !phoneNumber || !location || !schoolId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    await member.update({ name, email, phoneNumber, location, schoolId });
    res.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'A member with the same email or phone number already exists within the same school' });
    } else if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating member', error: error.message });
  }
});

// Delete a member
router.delete('/:id', async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    await member.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting member', error: error.message });
  }
});

module.exports = router;
