const authenticateManager = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(403);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', expired: true });
      }
      return res.sendStatus(403);
    }

    // Allow both 'SuperManager' and 'Admin' roles
    if (user.role !== 'SuperManager' && user.role !== 'Admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    console.log("Decoded user with sufficient permissions:", user);
    req.user = user;
    next();
  });
};

module.exports = authenticateManager;
