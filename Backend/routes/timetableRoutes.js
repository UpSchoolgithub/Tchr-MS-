// routes/timetableRoutes.js
const express = require('express');
const {
  assignPeriod,
  getAssignments,
  getTeacherTimetable,
  getSectionsByClass  // Import the newly created controller function
} = require('../controllers/timetableController'); // Import the required functions from the timetableController

const router = express.Router();

// Route for assigning a period to the timetable
router.post('/assign', assignPeriod);

// Route to get assignments for a specific section and class
router.get('/:schoolId/:classId/:sectionName/assignments', getAssignments);

// Route to get the timetable for a specific teacher
router.get('/teachers/:teacherId/timetable', getTeacherTimetable);

// New route to get sections for a specific class and school
router.get('/schools/:schoolId/classes/:classId/sections', getSectionsByClass);

module.exports = router;
