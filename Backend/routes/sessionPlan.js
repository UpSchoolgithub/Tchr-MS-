const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const SessionPlan = require('../models/SessionPlan');
const Topic = require('../models/Topic');

const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Upload Session Plans
// Upload Session Plans
router.post('/sessions/:sessionId/sessionPlans/upload', upload.single('file'), async (req, res) => {
  const { sessionId } = req.params;
  const file = req.file;

  try {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const sessionPlans = [];
      const topicsMap = {};

      sheet.forEach(row => {
          const sessionNumber = parseInt(row.SessionNumber, 10);

          if (isNaN(sessionNumber)) {
              throw new Error(`Invalid session number: ${row.SessionNumber}`);
          }

          const topicName = row.TopicName?.trim();
          const concepts = row.Concepts
              ? row.Concepts.split(';').map(concept => concept.trim())
              : [];

          if (!topicsMap[sessionNumber]) {
              topicsMap[sessionNumber] = [];
          }

          topicsMap[sessionNumber].push({ name: topicName, concepts });
      });

      for (const sessionNumber in topicsMap) {
          sessionPlans.push({
              sessionId,
              sessionNumber: parseInt(sessionNumber, 10),
              planDetails: JSON.stringify(topicsMap[sessionNumber]),
          });
      }

      const createdSessionPlans = await SessionPlan.bulkCreate(sessionPlans);

      res.status(201).json({ message: 'Session plans uploaded successfully', createdSessionPlans });
  } catch (error) {
      console.error('Error uploading session plans:', error.message);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Fetch Session Plans
router.get('/sessions/:sessionId/sessionPlans', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const sessionPlans = await SessionPlan.findAll({
      where: { sessionId },
      include: [Topic],
    });

    const formattedSessionPlans = sessionPlans.map(plan => ({
      ...plan.toJSON(),
      planDetails: JSON.parse(plan.planDetails),
      Topics: plan.Topics.map(topic => topic.topicName),
    }));

    console.log('Formatted Session Plans:', formattedSessionPlans); // Debugging line
    res.json(formattedSessionPlans);
  } catch (error) {
    console.error('Error fetching session plans:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update Session Plan
router.put('/sessionPlans/:id', async (req, res) => {
  const { id } = req.params;
  const { planDetails } = req.body;

  try {
    const sessionPlan = await SessionPlan.findByPk(id);
    if (!sessionPlan) {
      return res.status(404).json({ message: 'Session plan not found' });
    }

    sessionPlan.planDetails = planDetails;
    await sessionPlan.save();

    res.json({ message: 'Session plan updated successfully' });
  } catch (error) {
    console.error('Error updating session plan:', error);
    res.status(500).json({ message: 'Failed to update session plan' });
  }
});

// Add a new topic in the middle
router.post('/sessionPlans/:id/addTopic', async (req, res) => {
  const { id } = req.params;
  const { topicName, order } = req.body;

  try {
    const sessionPlan = await SessionPlan.findByPk(id);
    if (!sessionPlan) {
      return res.status(404).json({ message: 'Session plan not found' });
    }

    // Update the order of subsequent topics
    await Topic.increment('order', {
      by: 1,
      where: {
        sessionPlanId: id,
        order: {
          [Op.gte]: order,
        },
      },
    });

    // Add the new topic
    await Topic.create({
      sessionPlanId: id,
      topicName,
      order,
    });

    return res.status(201).json({ message: 'Topic added successfully' });
  } catch (error) {
    console.error('Error adding topic:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Session Plans
router.delete('/sessions/:sessionId/sessionPlans', async (req, res) => {
  const { sessionId } = req.params;

  try {
    await SessionPlan.destroy({
      where: { sessionId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting session plans:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete All Session Plans for a Session
router.delete('/sessions/:sessionId/sessionPlans', async (req, res) => {
  const { sessionId } = req.params;

  try {
    await SessionPlan.destroy({
      where: { sessionId },
    });

    await Topic.destroy({
      where: { sessionPlanId: sessionId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting all session plans:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
