const express = require('express');
const { recordAttendance, getAttendance } = require('../controllers/attendanceController');
const router = express.Router();

router.post('/record', recordAttendance);
router.get('/:studentId', getAttendance);

module.exports = router;
