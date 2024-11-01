// File: middleware/cors.js
const cors = require('cors');

const allowedOrigins = [
    'https://sm.up.school',
    'https://teachermanager.up.school',
    'https://myclasses.up.school',
    'https://tms.up.school'
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Allow request
        } else {
            callback(new Error('Not allowed by CORS')); // Block request
        }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
