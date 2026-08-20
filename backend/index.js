require('dotenv').config();
if (!globalThis.crypto) {
  const { webcrypto } = require('node:crypto');
  globalThis.crypto = webcrypto;
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const prisma = require('./db');
const app = express();
const PORT = process.env.PORT || 5000;

// Trust the first proxy (Render load balancer)
app.set('trust proxy', 1);

// --- CRITICAL SECURITY MIDDLEWARE ORDER ---

// 1. CORS - MUST BE FIRST
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Access-Token']
}));

// 2. Security Headers (with CORS-friendly settings)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 4. Request Parsing
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 5. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: () => process.env.SECURITY_DISABLED === 'true',
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// --- ROUTES ---

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const attendanceRoutes = require('./routes/attendance');
const superAdminRoutes = require('./routes/superAdmin');
const broadcastRoutes = require('./routes/broadcasts');
const outLocationRoutes = require('./routes/outLocation');
const leaveRoutes = require('./routes/leave');
const expenseRoutes = require('./routes/expenses');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/out-location', outLocationRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/expenses', expenseRoutes);


// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'active', timestamp: new Date() });
});

const { startMaintenanceService } = require('./services/maintenanceService');

app.listen(PORT, () => {
  console.log(`🚀 Master Server listening on port ${PORT}`);
  // Start Background Maintenance (Auto-Checkout, Retention, Capacity)
  startMaintenanceService();
});
