// middleware/cors.js
const cors = require('cors');

// Define the list of allowed origins
const allowedOrigins = [
    'https://sm.up.school',
    'https://teachermanager.up.school',
    'https://myclasses.up.school',
    'http://localhost:3000'  // For development

  ];
  
  const corsOptions = {
    origin: function (origin, callback) {
      console.log('Incoming origin:', origin); // Log incoming origin to debug
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS: ' + origin));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
  };
  

module.exports = cors(corsOptions);
