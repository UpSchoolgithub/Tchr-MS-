const express = require('express');
const {
  assignPeriod,
  getAssignments,
  getTeacherTimetable,
  getSectionsByClass
} = require('../controllers/timetableController'); // Import the required functions from the controller

const router = express.Router();

// TEMPORARY: Route to check if /assign is working (for debugging)
router.get('/assign', (req, res) => {
  res.status(200).json({ message: "Assign route is working!" });
});

// Route for assigning a period to the timetable (POST /api/assign)
router.post('/assign', assignPeriod);



// Route to get assignments for a specific section and class (GET /api/:schoolId/:classId/:sectionName/assignments)
router.get('/:schoolId/:classId/:sectionName/assignments', getAssignments);

// Route to get the timetable for a specific teacher (GET /api/teachers/:teacherId/timetable)
router.get('/teachers/:teacherId/timetable', getTeacherTimetable);

// New route to get sections for a specific class and school (GET /api/schools/:schoolId/classes/:classId/sections)
router.get('/schools/:schoolId/classes/:classId/sections', getSectionsByClass);

// Route for fetching timetable assignments by sectionId (GET /api/timetable/:schoolId/:classId/:sectionId/assignments)
router.get('/timetable/:schoolId/:classId/:sectionId/assignments', (req, res) => {
  console.log('Request Object:', req);
  res.status(200).json({ message: "Check logs for request object details" });
});

router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test route works!' });
});


module.exports = router;
