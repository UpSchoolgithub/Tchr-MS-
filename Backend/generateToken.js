require('dotenv').config();
const jwt = require('jsonwebtoken');

const payload = {
  id: 4,  // Your payload data (e.g., manager's ID)
  email: 'upscho2ol@gmail.com'  // Adjust as necessary
};

const secret = '1ea5b2153c86ee0d25ec28bfdaf9f9f7a82509025f588911337e7f7366e863fa';  // Hardcoded secret for testing
console.log('JWT Secret in Token Generation:', secret);  // Log secret to verify

const options = {
  expiresIn: '30d'  // Set token expiration time
};

const token = jwt.sign(payload, secret, options);
console.log('Generated JWT Token:', token);
