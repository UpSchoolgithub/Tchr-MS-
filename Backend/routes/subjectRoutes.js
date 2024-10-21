const express = require('express');
const router = express.Router();
const { getAllSubjects, getSubjectsBySchool } = require('../controllers/subjectController'); // Import the controllers

// Route to get all subjects
router.get('/subjects', getAllSubjects);

// Route to get subjects by schoolId
router.get('/:schoolId/subjects', getSubjectsBySchool);

module.exports = router;
