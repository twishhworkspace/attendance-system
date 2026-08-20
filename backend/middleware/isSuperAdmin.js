const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Access Refused: Master Control authorization required.' });
  }
};

module.exports = { isSuperAdmin };
