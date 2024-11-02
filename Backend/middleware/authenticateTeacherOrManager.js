// middleware/authenticateTeacherOrManager.js
const jwt = require('jsonwebtoken');

const authenticateTeacherOrManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log("Decoded user:", decoded);

    // Check for teacher or manager role
    if (decoded.isTeacher || decoded.isManager) {
      req.user = decoded;
      next();
    } else {
      console.log("Access denied: User is neither teacher nor manager");
      res.status(403).json({ message: 'Access denied: not a teacher or manager' });
    }
  });
};

module.exports = authenticateTeacherOrManager;
