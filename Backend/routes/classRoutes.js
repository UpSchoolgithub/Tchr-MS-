// routes/classRoutes.js
const express = require('express');
const { Class } = require('../models');
const router = express.Router();

// Route to get class by id
router.get('/classes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const classInfo = await Class.findByPk(id);
    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.status(200).json(classInfo);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
