const express = require('express');
const { recordTest, getTests } = require('../controllers/testController');
const router = express.Router();

router.post('/record', recordTest);
router.get('/:studentId', getTests);

module.exports = router;
