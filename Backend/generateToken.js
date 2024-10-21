require('dotenv').config();
const jwt = require('jsonwebtoken');

const payload = {
  id: 4,  // Your payload data (e.g., manager's ID)
  email: 'upscho2ol@gmail.com'  // Adjust as necessary
};

const secret = process.env.JWT_SECRET || 'your_jwt_secret';
console.log('JWT Secret in Token Generation:', secret);  // Log secret to verify

const options = {
  expiresIn: '30d'  // Set token expiration time
};

const token = jwt.sign(payload, secret, options);
console.log('Generated JWT Token:', token);
