const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getStatus, verifyLocation, getHistory, logMissedCheckoutReason } = require('../controllers/attendanceController');
const { dataSubmissionLimiter } = require('../middleware/rateLimiters');
const { authenticateToken } = require('../middleware/auth');

const { validate, checkInSchema, checkOutSchema } = require('../utils/validators');

router.post('/check-in', authenticateToken, dataSubmissionLimiter, validate(checkInSchema), checkIn);
router.post('/check-out', authenticateToken, dataSubmissionLimiter, validate(checkOutSchema), checkOut);
router.post('/verify', authenticateToken, verifyLocation);
router.get('/status', authenticateToken, getStatus);
router.get('/history', authenticateToken, getHistory);
router.post('/log-missed-checkout-reason', authenticateToken, dataSubmissionLimiter, logMissedCheckoutReason);
router.get('/notices', authenticateToken, require('../controllers/noticeController').getRecentNotices);

module.exports = router;
