const rbacMiddleware = (allowedRoles) => {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).send({ error: 'Access denied.' });
      }
      next();
    };
  };
  
  module.exports = rbacMiddleware;
  