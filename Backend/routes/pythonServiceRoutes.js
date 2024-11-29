const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Endpoint to generate lesson plan
router.post('/generate-lesson-plan', async (req, res) => {
    try {
        const pythonApiUrl = 'http://localhost:8000/generate-lesson-plan';

        // Forward request body to Python service
        const response = await axios.post(pythonApiUrl, req.body);

        if (response.data.lesson_plan) {
            res.status(200).json({ lesson_plan: response.data.lesson_plan });
        } else {
            res.status(500).json({ error: 'Failed to generate lesson plan' });
        }
    } catch (error) {
        console.error('Error calling FastAPI:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to download lesson plan as PDF
router.post('/download-pdf', async (req, res) => {
    try {
        const pythonApiUrl = 'http://localhost:8000/download-pdf';

        // Call Python service to generate and return the PDF
        const response = await axios.post(pythonApiUrl, req.body, {
            responseType: 'stream', // Handle binary data for PDF
        });

        const fileName = 'lesson_plan.pdf';
        const filePath = path.join(__dirname, fileName);

        // Save the PDF locally
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                }
                fs.unlinkSync(filePath); // Delete file after sending
            });
        });

        writer.on('error', (err) => {
            console.error('Error writing file:', err.message);
            res.status(500).json({ error: 'Failed to create PDF file' });
        });
    } catch (error) {
        console.error('Error calling FastAPI:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
