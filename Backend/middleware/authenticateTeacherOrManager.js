const jwt = require('jsonwebtoken');

const authenticateTeacherOrManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error("No token provided");
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

    // Log the decoded token to see its contents
    console.log("Decoded token payload:", decoded);

    // Check for either teacher or manager role
    if (!decoded.isTeacher && !decoded.isManager) {
      console.error("Access denied: User is neither a teacher nor a manager");
      return res.status(403).json({ message: 'Access denied: not a teacher or manager' });
    }

    console.log("Access granted for user with role:", decoded.isTeacher ? "Teacher" : "Manager");
    req.user = decoded; // Attach the decoded user information to the request
    next();
  });
};

module.exports = authenticateTeacherOrManager;
