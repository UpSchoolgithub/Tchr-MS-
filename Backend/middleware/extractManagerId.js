const extractManagerId = (req, res, next) => {
    const { user } = req;
    if (!user || !user.managerId) {
      return res.status(403).json({ message: 'Manager ID is not available in the token' });
    }
    req.managerId = user.managerId;
    next();
  };
  
  module.exports = extractManagerId;
  