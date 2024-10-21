const jwt = require('jsonwebtoken');

const authenticateManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Use a hard-coded secret temporarily for testing
  const hardcodedSecret = '1ea5b2153c86ee0d25ec28bfdaf9f9f7a82509025f588911337e7f7366e863fa';

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, hardcodedSecret, (err, decodedUser) => {
    if (err) {
      console.log('Token verification error:', err.message);
      return res.status(403).json({ message: 'Invalid token', error: err.message });
    }

    req.user = decodedUser;
    next();
  });
};

module.exports = authenticateManager;
