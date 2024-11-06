require('dotenv').config();
const jwt = require('jsonwebtoken');

const authenticateManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Log the received authorization header and extracted token
  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token:', token);

  // Use a hardcoded secret for testing; for production, use an environment variable.
  const secret = process.env.JWT_SECRET || '1ea5b2153c86ee0d25ec28bfdaf9f9f7a82509025f588911337e7f7366e863fa';
  console.log('JWT Secret in Token Verification:', secret);  // Log the secret for confirmation

  // Check if token exists
  if (!token) {
    console.log('No token provided');
    return res.status(403).json({ message: 'No token provided' });
  }

  // Verify the token using JWT secret
  jwt.verify(token, secret, (err, decodedUser) => {
    if (err) {
      console.log('Token verification error:', err.message);
      // Respond with an error message
      return res.status(403).json({ message: 'Invalid token', error: err.message });
    }

    // Log the decoded token payload
    console.log('Decoded JWT Payload:', decodedUser);

    // Check if the decoded user has a manager role
    if (!decodedUser.isManager) {
      console.log('Access denied: User is not a manager');
      return res.status(403).json({ message: 'Access denied: User is not a manager' });
    }

    // Attach decoded user data to the request object for route access control
    req.user = decodedUser;
    next();
  });
};

module.exports = authenticateManager;
