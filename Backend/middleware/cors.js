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
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allows credentials to be sent from frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Defines allowed HTTP methods
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'Accept'], // Defines allowed headers
    optionsSuccessStatus: 200 // Ensures successful response for OPTIONS requests
};

module.exports = cors(corsOptions);
