const jwt = require('jsonwebtoken');

const payload = {
  // Your payload data
  id: 4, // Change to your manager id or appropriate user id
  email: 'upscho2ol@gmail.com' // Change to your manager email
};

const secret = process.env.JWT_SECRET || 'your_jwt_secret'; // Ensure your .env file has JWT_SECRET variable set
const options = {
  expiresIn: '1h' // Token validity
};

const token = jwt.sign(payload, secret, options);
console.log('Generated JWT Token:', token);
