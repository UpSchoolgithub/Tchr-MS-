const express = require('express');
const { sendNotification } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/send', authMiddleware, sendNotification);

module.exports = router;
