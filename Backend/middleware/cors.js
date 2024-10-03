const cors = require('cors');

const allowedOrigins = [
    'https://sm.up.school',
    'https://teachermanager.up.school',
    'https://myclasses.up.school',
    'https://tms.up.school'  // Ensure this is included if it should be allowed
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true
};

module.exports = cors(corsOptions);
