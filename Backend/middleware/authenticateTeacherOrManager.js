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
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    console.log("Decoded user:", decoded);

    // Check if the user is a teacher or manager
    if (decoded.isTeacher || decoded.isManager) {
      req.user = decoded;
      return next();
    }

    return res.status(403).json({ message: 'Access denied: User is neither teacher nor manager' });
  });
};

module.exports = authenticateTeacherOrManager;
