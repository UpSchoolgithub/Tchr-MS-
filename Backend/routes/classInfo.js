const express = require('express');
const router = express.Router();
const { ClassInfo, Section, School } = require('../models');

// Get all classes, optionally including sections
router.get('/classes', async (req, res) => {
  try {
    const classInfos = await ClassInfo.findAll({
      include: [{ model: Section }]
    });
    res.status(200).json(classInfos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve classes' });
  }
});

// Get a specific class by ID, optionally including sections
router.get('/classes/:id', async (req, res) => {
  try {
    const classInfo = await ClassInfo.findByPk(req.params.id, {
      include: [{ model: Section }]
    });
    if (classInfo) {
      res.status(200).json(classInfo);
    } else {
      res.status(404).json({ error: 'Class not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve the class' });
  }
});

// Create a new class
router.post('/classes', async (req, res) => {
  try {
    const { className, subject, schoolId } = req.body;

    // Validate the school ID
    const school = await School.findByPk(schoolId);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const newClass = await ClassInfo.create({
      className,
      subject,
      schoolId,
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Update a class by ID
router.put('/classes/:id', async (req, res) => {
  try {
    const { className, subject } = req.body;
    const classInfo = await ClassInfo.findByPk(req.params.id);

    if (classInfo) {
      classInfo.className = className || classInfo.className;
      classInfo.subject = subject || classInfo.subject;
      await classInfo.save();
      res.status(200).json(classInfo);
    } else {
      res.status(404).json({ error: 'Class not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Delete a class by ID
router.delete('/classes/:id', async (req, res) => {
  try {
    const classInfo = await ClassInfo.findByPk(req.params.id);

    if (classInfo) {
      await classInfo.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Class not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

module.exports = router;
