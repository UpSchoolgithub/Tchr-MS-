// Backend\middleware\authenticateToken.js

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(403);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', expired: true });
      }
      return res.sendStatus(403);
    }

    console.log("Decoded user:", user); // This should log the correct user object

    // Ensure only users with the SuperManager role can create managers
    if (user.role !== 'SuperManager') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
