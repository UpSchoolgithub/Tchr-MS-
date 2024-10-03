// middleware/cors.js
const cors = require('cors');

// Define allowed origins
const allowedOrigins = [
    'https://sm.up.school',
    'https://teachermanager.up.school',
    'https://myclasses.up.school',
    'https://tms.up.school'
];

// CORS options
const corsOptions = {
    origin: (origin, callback) => {
        console.log(`Origin of request: ${origin}`);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
};

// Export the middleware as a function
module.exports = cors(corsOptions);
