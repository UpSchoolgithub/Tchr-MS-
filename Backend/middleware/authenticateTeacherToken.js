const jwt = require('jsonwebtoken');

const authenticateTeacherToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err);

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', expired: true });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log("Decoded user:", decoded);

    if (!decoded.isTeacher) {
      return res.status(403).json({ message: 'Access denied: not a teacher' });
    }

    req.user = decoded;
    next();
  });
};

module.exports = authenticateTeacherToken;
