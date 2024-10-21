// routes/timetableRoutes.js
const express = require('express');
const {
  assignPeriod,
  getAssignments,
  getTeacherTimetable
} = require('../controllers/timetableController'); // Import the required functions from the timetableController

const router = express.Router();

// Route for assigning a period to the timetable
router.post('/assign', assignPeriod);

// Route to get assignments for a specific section and class
router.get('/:schoolId/:classId/:sectionName/assignments', getAssignments);

// Route to get the timetable for a specific teacher
router.get('/teachers/:teacherId/timetable', getTeacherTimetable);

module.exports = router;
