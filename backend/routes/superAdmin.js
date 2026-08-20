const express = require('express');
const router = express.Router();
console.log("[MOUNT] SUPER-ADMIN ROUTES INITIALIZING...");
const { adminActionLimiter } = require('../middleware/rateLimiters');
const { authenticateToken } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/isSuperAdmin');
const {
  getGlobalStats,
  getAllCompanies,
  updateCompanyAdminPassword,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus,
  createBroadcast,
  getBroadcasts,
  toggleBroadcast,
  getGlobalTickets,
  replyToTicket,
  runArchivalProtocol
} = require('../controllers/superAdminController');

// All routes here require Master Control Authorization
router.use(authenticateToken);
router.use(isSuperAdmin);

router.get('/stats', getGlobalStats);
router.get('/companies', getAllCompanies);
router.post('/companies/:companyId/reset-password', updateCompanyAdminPassword);
router.put('/companies/:id', updateCompany);
router.post('/companies/:id/toggle', toggleCompanyStatus);
router.delete('/companies/:id', deleteCompany);

// Broadcast Routes
router.post('/broadcasts', createBroadcast);
router.get('/broadcasts', getBroadcasts);
router.post('/broadcasts/:id/toggle', toggleBroadcast);

// Ticket Routes
router.get('/tickets', getGlobalTickets);
router.post('/tickets/:ticketId/reply', replyToTicket);

// Maintenance Routes
router.post('/maintenance/archive', runArchivalProtocol);

module.exports = router;
