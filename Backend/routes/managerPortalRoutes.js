const express = require('express');
const { Manager, School } = require('../models');
const authenticateManager = require('../middleware/authenticateManager'); // Ensure correct path
const router = express.Router();

// Fetch schools tagged to a specific manager
router.get('/:managerId/schools', authenticateManager, async (req, res) => {
  const { managerId } = req.params;
  console.log('Route - Manager ID:', managerId); // Debugging
  try {
    const manager = await Manager.findByPk(managerId, {
      include: {
        model: School,
        through: { attributes: [] }
      }
    });
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
