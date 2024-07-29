const express = require('express');
const { uploadStudents } = require('../controllers/studentController');
const router = express.Router();

router.post('/upload', uploadStudents);

module.exports = router;
