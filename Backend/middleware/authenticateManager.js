const jwt = require('jsonwebtoken');  // Ensure this is included

const authenticateManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Log the received token for debugging
  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token:', token);

  // Verify if the token is present
  if (!token) {
    console.log('No token provided');
    return res.status(403).json({ message: 'No token provided' });  // Forbidden if no token
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        console.log('Token expired');
        return res.status(401).json({ message: 'Token expired', expired: true });
      }
      console.log('Token verification error:', err.message);
      return res.status(403).json({ message: 'Invalid token', error: err.message });  // Forbidden if token verification fails
    }

    // Log the decoded token payload for debugging
    console.log('Decoded JWT Payload:', decodedUser);

    // Ensure the decoded token has the required fields
    if (!decodedUser || !decodedUser.role || !decodedUser.id) {
      console.log('Invalid token payload');
      return res.status(403).json({ message: 'Invalid token payload' });
    }

    // Check if the user has the correct role
    if (decodedUser.role !== 'SuperManager' && decodedUser.role !== 'Admin') {
      console.log('User does not have sufficient permissions:', decodedUser.role);
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Attach the user information to the request object
    req.user = decodedUser;
    console.log('User authenticated with role:', decodedUser.role);

    next();  // Proceed to the next middleware
  });
};

module.exports = authenticateManager;
