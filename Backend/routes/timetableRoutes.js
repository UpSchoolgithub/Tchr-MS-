const express = require('express');
const { assignPeriod, getAssignments } = require('../controllers/timetableController');
const router = express.Router();

// Define the route for assigning a period
router.post('/assign', assignPeriod);

// Define the route for fetching assignments
router.get('/:schoolId/:classId/:sectionName/assignments', getAssignments);

// Route to get the timetable for a specific teacher
router.get('/teachers/:teacherId/timetable', timetableController.getTeacherTimetable);

module.exports = router;
