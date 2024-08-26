// middleware/authenticateTeacherToken.js

const jwt = require('jsonwebtoken');

const authenticateTeacherToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', expired: true });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }

    console.log("Decoded user:", decoded); // This should log the correct user object

    // Additional validation specific to teachers
    if (!decoded.isTeacher) {
      return res.status(403).json({ message: 'Access denied: not a teacher' });
    }

    // If the decoded token includes specific teacher information, set it for downstream use
    req.user = decoded;
    next();
  });
};

module.exports = authenticateTeacherToken;
