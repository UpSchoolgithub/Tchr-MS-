// Import necessary modules
const cors = require('cors');
const express = require('express');
const app = express();

// Define your allowed origins
const allowedOrigins = [
    'https://sm.up.school',
    'https://teachermanager.up.school',
    'https://myclasses.up.school',
    'https://tms.up.school'
];

// CORS Options
const corsOptions = {
    origin: function (origin, callback) {
        console.log(`Origin of request ${origin}`);
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            console.log('Allowed CORS for:', origin);
            callback(null, true);
        } else {
            console.log('Blocked CORS for:', origin);
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true, // Reflect the request origin, as defined by `origin` above
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Apply CORS middleware globally
app.use(cors(corsOptions));

// Handle preflight requests globally (important for POST/PUT/DELETE)
app.options('*', cors(corsOptions));

// Example route to test if CORS is working
app.get('/api/some-route', (req, res) => {
    res.json({ message: 'This route is CORS-enabled for an allowed origin.' });
});

// Start server (ensure that `PORT` is defined in your environment)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
