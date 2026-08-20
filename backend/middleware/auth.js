const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  let token = req.cookies.token || 
              req.headers['x-access-token'] || 
              req.headers['authorization'];

  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }

  // Handle common edge cases where tokens might be passed as strings 'null' or 'undefined'
  if (token === 'null' || token === 'undefined' || !token) {
    token = null;
  }

  if (!token) {
    console.warn(`[AUTH_FAILURE] Missing token for ${req.method} ${req.originalUrl} | IP: ${req.ip} | Headers: ${JSON.stringify(req.headers)}`);
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.warn(`[AUTH_FAILURE] Invalid token for ${req.method} ${req.originalUrl} | Error: ${err.message}`);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
