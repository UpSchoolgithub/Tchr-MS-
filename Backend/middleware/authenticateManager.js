const jwt = require('jsonwebtoken');  // Ensure this is included

const authenticateManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Log the received token for debugging
  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token:', token);

  if (token == null) {
    console.log('No token provided');
    return res.sendStatus(403);  // Forbidden if no token
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        console.log('Token expired');
        return res.status(401).json({ message: 'Token expired', expired: true });
      }
      console.log('Token verification error:', err.message);
      return res.sendStatus(403);  // Forbidden if token verification fails
    }

    // Log the decoded token payload
    console.log('Decoded JWT Payload:', decodedUser);

    // Check if the decoded token contains the user
    if (!decodedUser) {
      console.log('No user found in token');
      return res.status(403).json({ message: 'No user found in token' });
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
