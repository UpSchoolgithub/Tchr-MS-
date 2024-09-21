// middleware/cors.js
const cors = require('cors');

// Define the list of allowed origins
const allowedOrigins = [
  'https://sm.up.school',
  'https://teachermanager.up.school',
  'https://myclasses.up.school',
];

// Define CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
