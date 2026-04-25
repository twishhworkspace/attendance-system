// TwishhSync Master Control Hub - Strategic Initialization
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const prisma = require('./db');
const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // Trust first proxy (Nginx)

// Router Imports
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const superAdminRoutes = require('./routes/superAdmin');
const attendanceRoutes = require('./routes/attendance');
const broadcastRoutes = require('./routes/broadcasts');
const outLocationRoutes = require('./routes/outLocation');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://ui-avatars.com"],
      connectSrc: ["'self'", "http://localhost:5000"]
    }
  }
}));

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));


app.use(express.json({ limit: '10kb' })); // Body limit to prevent DOS
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(xss()); // Data sanitization against XSS
app.use(cookieParser());

// Rate Limiting Protection
const { 
    globalLimiter, 
    strictAuthLimiter 
} = require('./middleware/rateLimiters');

app.use('/api/', globalLimiter);
app.use('/api/auth/login', strictAuthLimiter);

// CSRF Defensive Handshake Middleware
app.use((req, res, next) => {
  if (process.env.SECURITY_DISABLED === 'true') return next();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const isXhr = req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers['x-requested-with'] === 'TwishhSync-App';
    // Axios automatically sends X-Requested-With: XMLHttpRequest
    if (!isXhr) {
      console.log(`[SECURITY] CSRF PERIMETER BREACH ATTEMPT - IP: ${req.ip}`);
      return res.status(403).json({ error: 'CSRF Defensive Violation: Handshake Required.' });
    }
  }
  next();
});

app.use((req, res, next) => {
  console.log(`[TRACE] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Legacy header removal (Helmet handles these now)

// --- CORE API MAPPING ---
console.log("[INIT] STRATEGIC ROUTE CLUSTERING STARTING...");
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/out-location', outLocationRoutes);

app.get('/api/echo', (req, res) => res.json({ message: 'ECHO_RESPONSE' }));

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'TwishhSync Hub Operational' });
});

app.get('/api/db-check', async (req, res) => {
    try {
        const count = await prisma.user.count();
        res.json({ status: 'OK', userCount: count });
    } catch (err) {
        console.error('[DIAGNOSTIC] DB CHECK FAILURE:', err);
        res.status(500).json({ status: 'ERROR', message: err.message, stack: err.stack });
    }
});

// Final Unmatched Route Tracer (Surgical Catch-all)
app.use((req, res, next) => {
  console.log(`[DEBUG] CATCH-ALL CHECKING: ${req.originalUrl}`);
  if (req.originalUrl.startsWith('/api')) {
    console.log(`[DEBUG] 404 TRIGGERED FOR: ${req.originalUrl}`);
    const AppError = require('./utils/AppError');
    return next(new AppError(`Strategic Endpoint Missing: ${req.originalUrl}`, 404));
  }
  console.log(`[DEBUG] FALLING THROUGH CATCH-ALL: ${req.originalUrl}`);
  next();
});

// Security Header Finalization
app.use((req, res, next) => {
  res.setHeader('X-Platform-Stabilization', 'V7-ACTIVE');
  next();
});

// Global Error Middleware
const globalErrorHandler = require('./middleware/errorMiddleware');
app.use(globalErrorHandler);

const { startMaintenanceService } = require('./services/maintenanceService');
const { startDataRetentionJob } = require('./services/schedulerService');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startMaintenanceService();
  startDataRetentionJob();
});

module.exports = { prisma, app };
