const express = require('express');
const { assignPeriod, getAssignments } = require('../controllers/timetableController');
const router = express.Router();

// Define the route for assigning a period
router.post('/assign', assignPeriod);

// Define the route for fetching assignments
router.get('/:schoolId/:classId/:sectionName/assignments', getAssignments);

module.exports = router;
