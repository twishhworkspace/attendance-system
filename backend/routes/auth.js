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
const { 
  getRegOptions, 
  verifyReg, 
  getAuthOptions, 
  verifyAuth 
} = require('../controllers/passkeyController');
const { strictAuthLimiter } = require('../middleware/rateLimiters');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', strictAuthLimiter, login);
router.post('/register-company', strictAuthLimiter, registerCompany);

// Biometric / Passkey Endpoints
router.get('/passkey/register-options', authenticateToken, strictAuthLimiter, getRegOptions);
router.post('/passkey/verify-registration', authenticateToken, strictAuthLimiter, verifyReg);
router.get('/passkey/login-options', strictAuthLimiter, getAuthOptions);
router.post('/passkey/verify-login', strictAuthLimiter, verifyAuth);

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/logout', logout);
router.post('/report-bug', authenticateToken, reportBug);

module.exports = router;
