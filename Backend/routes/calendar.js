const express = require('express');
const router = express.Router();

router.post('/create-event', async (req, res) => {
  try {
    const { title, description, startDate, endDate, school_id } = req.body;
    const newEvent = await Event.create({ title, description, startDate, endDate, school_id });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Error creating event' });
  }
});

module.exports = router;
