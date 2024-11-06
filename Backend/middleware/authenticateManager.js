const jwt = require('jsonwebtoken');

const authenticateManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token:', token);

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  console.log('JWT Secret in Token Verification:', secret);

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

    // Check if the decoded user has a manager role
    if (!decodedUser.isManager) {
      console.log('Access denied: User is not a manager');
      return res.status(403).json({ message: 'Access denied: User is not a manager' });
    }

    req.user = decodedUser;
    next();
  });
};

module.exports = authenticateManager;
