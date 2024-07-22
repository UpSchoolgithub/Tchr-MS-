const express = require('express');
const router = express.Router();
const School = require('../models/School');
const TimetableSettings = require('../models/timetableSettings');
const SchoolCalendar = require('../models/SchoolCalendar');
const ClassInfo = require('../models/ClassInfo');

const authenticateManager = require('../middleware/authenticateManager');

// Get all schools
router.get('/schools', async (req, res) => {
  try {
    const schools = await School.findAll();
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single school
router.get('/schools/:id', async (req, res) => {
  const schoolId = req.params.id;
  try {
    const school = await School.findByPk(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new school
router.post('/schools', async (req, res) => {
  const { name, email, phoneNumber, website, logo } = req.body;
  try {
    const newSchool = await School.create({ name, email, phoneNumber, website, logo });
    res.status(201).json(newSchool);
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a school
router.put('/schools/:id', async (req, res) => {
  const schoolId = req.params.id;
  const { name, email, phoneNumber, website, logo } = req.body;
  try {
    const school = await School.findByPk(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    await school.update({ name, email, phoneNumber, website, logo });
    res.json({ message: 'School updated successfully' });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a school
router.delete('/schools/:id', async (req, res) => {
  const schoolId = req.params.id;
  try {
    const school = await School.findByPk(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    await school.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get timetable settings for a school
router.get('/schools/:id/timetable', async (req, res) => {
  const schoolId = req.params.id;
  try {
    const timetableSettings = await TimetableSettings.findOne({ where: { schoolId } });
    if (!timetableSettings) {
      return res.status(404).send({ message: 'Timetable not found' });
    }
    res.send(timetableSettings);
  } catch (error) {
    console.error(`Error fetching timetable settings for schoolId=${schoolId}:`, error);
    res.status(500).send({ message: 'Internal server error', error: error.message });
  }
});

// Update or create timetable settings for a school
router.put('/schools/:id/timetable', async (req, res) => {
  const schoolId = req.params.id;
  const settings = req.body;
  try {
    let timetableSettings = await TimetableSettings.findOne({ where: { schoolId } });
    if (!timetableSettings) {
      timetableSettings = await TimetableSettings.create({ schoolId, ...settings });
      return res.send({ message: 'Timetable settings created successfully' });
    }
    await timetableSettings.update(settings);
    res.send({ message: 'Timetable settings updated successfully' });
  } catch (error) {
    console.error(`Error updating timetable settings for schoolId=${schoolId}:`, error);
    res.status(500).send({ message: 'Internal server error', error: error.message });
  }
});

// Fetch schools tagged to the authenticated manager along with classes and sections
router.get('/manager-schools', authenticateManager, async (req, res) => {
  try {
    const managerId = req.managerId; // The ID is set by the authenticateManager middleware
    const schools = await School.findAll({
      where: { managerId: managerId }
    });
    res.status(200).json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ message: 'Error fetching schools', error });
  }
});


// Fetch events for a school
router.get('/schools/:schoolId/calendar', async (req, res) => {
  const schoolId = req.params.schoolId;
  try {
    const events = await SchoolCalendar.findAll({ where: { schoolId } });
    res.json(events);
  } catch (error) {
    console.error('Error fetching school calendar:', error);
    res.status(500).json({ error: 'Error fetching school calendar' });
  }
});

module.exports = router;
