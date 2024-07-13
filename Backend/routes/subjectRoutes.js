const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject'); // Ensure the path is correct

// Route to get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.findAll();
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
