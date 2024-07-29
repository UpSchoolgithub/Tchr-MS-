const express = require('express');
const { recordAssignment, getAssignments } = require('../controllers/assignmentController');
const router = express.Router();

router.post('/record', recordAssignment);
router.get('/:studentId', getAssignments);

module.exports = router;
