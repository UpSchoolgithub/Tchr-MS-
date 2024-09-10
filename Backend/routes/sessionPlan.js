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
      const sessionNumber = row.sessionNumber;
      const topicNames = row.TopicName.split(';').map(name => name.trim());

      if (!topicsMap[sessionNumber]) {
        topicsMap[sessionNumber] = [];
      }

      topicsMap[sessionNumber] = topicsMap[sessionNumber].concat(topicNames);
    });

    for (const sessionNumber in topicsMap) {
      sessionPlans.push({
        sessionId,
        sessionNumber: parseInt(sessionNumber, 10),
        planDetails: JSON.stringify(topicsMap[sessionNumber]),
      });
    }

    const createdSessionPlans = await SessionPlan.bulkCreate(sessionPlans);

    // Create topics for each session plan
    for (const plan of createdSessionPlans) {
      const topics = JSON.parse(plan.planDetails).map((topic, index) => ({
        sessionPlanId: plan.id,
        topicName: topic,
        order: index + 1,
      }));
      await Topic.bulkCreate(topics);
    }

    res.status(201).json({ message: 'Session plans uploaded successfully' });
  } catch (error) {
    console.error('Error uploading session plans:', error);
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

    await Topic.destroy({ where: { sessionPlanId: id } });

    const topics = JSON.parse(planDetails).map((topic, index) => ({
      sessionPlanId: id,
      topicName: topic,
      order: index + 1,
    }));

    await Topic.bulkCreate(topics);

    return res.status(200).json({ message: 'Session plan updated successfully' });
  } catch (error) {
    console.error('Error updating session plan:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
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

// session plan pdf
router.post('/sessions/:sessionId/sessionPlans/uploadPdf', upload.single('file'), async (req, res) => {
  const { sessionId } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Assuming you're saving the file path in the database with the sessionId
    const fileUrl = `/uploads/${file.filename}`; // Modify as per your file serving setup
    await Session.update({ pdfUrl: fileUrl }, { where: { id: sessionId } }); // Update the session with the PDF URL

    res.status(201).json({ message: 'PDF uploaded successfully', fileUrl });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.get('/sessions/:sessionId/getPdf', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findByPk(sessionId);
    if (session) {
      return res.status(200).json({ pdfUrl: session.pdfUrl });
    } else {
      return res.status(404).json({ message: 'Session not found' });
    }
  } catch (error) {
    console.error('Error fetching session details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

const handlePdfDelete = async () => {
  if (!pdfUrl) {
    setError('No PDF to delete.');
    return;
  }

  try {
    await axios.delete(`https://tms.up.school/api/sessions/${sessionId}/sessionPlans/deletePdf`, {
      data: { fileUrl: pdfUrl }, // Send the file URL to identify which PDF to delete
    });
    setPdfUrl(null); // Clear the PDF URL after successful deletion
    alert('PDF deleted successfully');
  } catch (error) {
    console.error('Error deleting PDF:', error);
    if (error.response && error.response.data) {
      setError(error.response.data.message);
    }
  }
};

module.exports = router;
