// middleware/authenticateTeacherOrManager.js
const authenticateTeacherToken = require('../middleware/authenticateTeacherToken');
const authenticateManager = require('../middleware/authenticateManager');

const authenticateTeacherOrManager = (req, res, next) => {
  authenticateTeacherToken(req, res, (teacherErr) => {
    if (!teacherErr) return next(); // Proceed if authenticated as teacher

    authenticateManager(req, res, (managerErr) => {
      if (!managerErr) return next(); // Proceed if authenticated as manager

      // If both authentication checks fail, deny access
      res.status(403).json({ message: 'Access denied: not a teacher or manager' });
    });
  });
};

module.exports = authenticateTeacherOrManager;
