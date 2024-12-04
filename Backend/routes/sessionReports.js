const express = require('express');
const router = express.Router();
const sessionReportsController = require('../controllers/sessionReportsController');

// Fetch session report by sessionId
router.get('/session-reports/:sessionId', sessionReportsController.getSessionReport);

module.exports = router;
