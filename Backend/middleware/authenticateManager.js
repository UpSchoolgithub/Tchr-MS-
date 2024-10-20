const authenticateManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Check if token exists
  if (token == null) {
    console.log('No token provided');
    return res.sendStatus(403);  // Forbidden if no token
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        console.log('Token expired');
        return res.status(401).json({ message: 'Token expired', expired: true });
      }
      console.log('Token verification error:', err.message);
      return res.sendStatus(403);  // Forbidden if token verification fails
    }

    // Check if the user has the correct role
    if (user.role !== 'SuperManager' && user.role !== 'Admin') {
      console.log('User does not have sufficient permissions:', user.role);
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    console.log('User authenticated with role:', user.role);
    req.user = user;  // Attach user info to the request object
    next();  // Proceed to the next middleware
  });
};

module.exports = authenticateManager;
