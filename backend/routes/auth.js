const express = require('express');
const router = express.Router();
const { 
  login, 
  getProfile, 
  updateProfile, 
  registerCompany,
  reportBug,
  logout
} = require('../controllers/authController');
const { strictAuthLimiter } = require('../middleware/rateLimiters');
const { authenticateToken } = require('../middleware/auth');

const { validate, loginSchema } = require('../utils/validators');

router.post('/login', strictAuthLimiter, validate(loginSchema), login);
router.post('/register-company', strictAuthLimiter, registerCompany);

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/logout', logout);
router.post('/report-bug', authenticateToken, reportBug);

module.exports = router;
