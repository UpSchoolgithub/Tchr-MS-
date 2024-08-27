const express = require('express');
const {
  assignPeriod,
  getAssignments,
  getTeacherTimetable
} = require('../controllers/timetableController'); // Import the required functions from the timetableController

const router = express.Router();

// Define the route for assigning a period
router.post('/assign', assignPeriod);

// Define the route for fetching assignments
router.get('/:schoolId/:classId/:sectionName/assignments', getAssignments);

// Route to get the timetable for a specific teacher
router.get('/teachers/:teacherId/timetable', getTeacherTimetable);

module.exports = router;
