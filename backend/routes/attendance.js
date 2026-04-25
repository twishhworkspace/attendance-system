const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getStatus, verifyLocation } = require('../controllers/attendanceController');
const { dataSubmissionLimiter } = require('../middleware/rateLimiters');
const { authenticateToken } = require('../middleware/auth');

const { validate, checkInSchema, checkOutSchema } = require('../utils/validators');

router.post('/check-in', authenticateToken, dataSubmissionLimiter, validate(checkInSchema), checkIn);
router.post('/check-out', authenticateToken, dataSubmissionLimiter, validate(checkOutSchema), checkOut);
router.post('/verify', authenticateToken, verifyLocation);
router.get('/status', authenticateToken, getStatus);

module.exports = router;
