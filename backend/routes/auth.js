const express = require('express');
const router = express.Router();
const { 
  login, 
  getProfile, 
  updateProfile, 
  registerCompany,
  reportBug,
  logout,
  verifyOTP,
  getRegistrationOptions,
  verifyPasskeyRegistration,
  getLoginOptions,
  verifyPasskeyLogin,
  clearPasskeys
} = require('../controllers/authController');
const { strictAuthLimiter } = require('../middleware/rateLimiters');
const { authenticateToken } = require('../middleware/auth');

const { validate, loginSchema } = require('../utils/validators');

router.post('/login', strictAuthLimiter, validate(loginSchema), login);
router.post('/verify-otp', strictAuthLimiter, verifyOTP);
router.post('/register-company', strictAuthLimiter, registerCompany);

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/logout', logout);
router.post('/report-bug', authenticateToken, reportBug);

// Passkey Biometrics
router.get('/passkey/register-options', authenticateToken, getRegistrationOptions);
router.post('/passkey/register-verify', authenticateToken, verifyPasskeyRegistration);
router.get('/passkey/login-options', getLoginOptions);
router.post('/passkey/login-verify', verifyPasskeyLogin);
router.delete('/passkey/clear', authenticateToken, clearPasskeys);

module.exports = router;
