const express = require('express');
const router = express.Router();
const { Assignment, Session } = require('../models');
const multer = require('multer'); // For file uploads
const path = require('path');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/assignments/'); // Set the directory for uploads
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Save or Update Assignment
router.get('/assignments/:sessionPlanId', async (req, res) => {
    const { sessionPlanId } = req.params;
  
    try {
      const assignment = await Assignment.findOne({ where: { sessionPlanId } });
      if (!assignment) {
        return res.status(404).json({ error: 'No assignment found for this session plan.' });
      }
  
      res.status(200).json(assignment);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      res.status(500).json({ error: 'Failed to fetch assignment.' });
    }
  });
  
  
// Fetch Assignments
router.get('/assignments/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const assignment = await Assignment.findOne({ where: { sessionId } });
    if (!assignment) {
      return res.status(404).json({ error: 'No assignment found for this session.' });
    }

    res.status(200).json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment.' });
  }
});

// Save or Update Assignment
router.post('/assignments', upload.single('file'), async (req, res) => {
    const { sessionPlanId, assignmentDetails } = req.body; // Get sessionPlanId from the request body
    const file = req.file ? `/uploads/assignments/${req.file.filename}` : null; // Uploaded file

    try {
        // Save or update assignment
        const assignment = await Assignment.upsert({
            sessionPlanId,
            assignmentDetails,
            assignmentFileUrl: file,
        });

        res.status(200).json({ message: 'Assignment saved successfully', assignment });
    } catch (error) {
        console.error('Error saving assignment:', error);
        res.status(500).json({ error: 'Failed to save assignment.' });
    }
});

  
module.exports = router;
