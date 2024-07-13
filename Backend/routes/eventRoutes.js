const express = require('express');
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent, uploadEvents } = require('../controllers/EventController'); // Ensure correct casing
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.get('/events/:schoolId', getEvents); // Updated to handle schoolId
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);
router.post('/events/upload', upload.single('file'), uploadEvents);

module.exports = router;
