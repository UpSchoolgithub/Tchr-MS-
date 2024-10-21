require('dotenv').config();  // Ensure this is loaded at the top
const jwt = require('jsonwebtoken');

const authenticateManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('JWT Secret in Token Verification:', process.env.JWT_SECRET);  // Log secret for verification

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      console.log('Token verification error:', err.message);
      return res.status(403).json({ message: 'Invalid token', error: err.message });
    }

    req.user = decodedUser;
    next();
  });
};

module.exports = authenticateManager;
