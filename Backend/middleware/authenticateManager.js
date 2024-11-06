require('dotenv').config();
const jwt = require('jsonwebtoken');

const authenticateManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token:', token);

  const secret = '1ea5b2153c86ee0d25ec28bfdaf9f9f7a82509025f588911337e7f7366e863fa';  // Hardcoded secret for testing
  console.log('JWT Secret in Token Verification:', secret);  // Log the secret to verify

  if (!token) {
    console.log('No token provided');
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, secret, (err, decodedUser) => {
    if (err) {
      console.log('Token verification error:', err.message);
      return res.status(403).json({ message: 'Invalid token', error: err.message });
    }

    console.log('Decoded JWT Payload:', decodedUser);
    req.user = decodedUser;
    next();
  });
};

module.exports = authenticateManager;
