const jwt = require('jsonwebtoken');

const payload = {
  id: 4,  // Change this to the manager's ID
  email: 'upscho2ol@gmail.com'  // Change this to the manager's email
};

// Use the same secret from .env file
const secret = process.env.JWT_SECRET || 'your_jwt_secret';
console.log('JWT Secret in Token Generation:', secret);  // Log secret to verify

const options = {
  expiresIn: '30d'  // Set token expiration
};

const token = jwt.sign(payload, secret, options);
console.log('Generated JWT Token:', token);
