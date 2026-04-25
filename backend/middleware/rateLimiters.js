const rateLimit = require('express-rate-limit');
const { logAction } = require('../utils/logger');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Production threshold
  skip: () => process.env.SECURITY_DISABLED === 'true',
  message: { error: 'Too many requests from this IP. Please try again later.' }
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Max 100 attempts per 15 minutes
  skip: () => process.env.SECURITY_DISABLED === 'true',
  handler: (req, res, next, options) => {
      console.log(`[SECURITY] BRUTE-FORCE ATTEMPT DETECTED - IP: ${req.ip}`);
      res.status(options.statusCode).send(options.message);
  },
  message: { error: 'Security Perimeter Active: Too many authentication attempts. Lock engaged for 15 minutes.' }
});

const dataSubmissionLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50, // Standard operational throughput
    message: { error: 'Tactical Overload: Too many data submissions. Slow down.' }
});

const adminActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Sufficient for legitimate admin work
    message: { error: 'Administrative Protection: Too many actions. Verify and retry later.' }
});

module.exports = {
    globalLimiter,
    strictAuthLimiter,
    dataSubmissionLimiter,
    adminActionLimiter
};
