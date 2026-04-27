const express = require('express');
const router = express.Router();
console.log("[MOUNT] ADMIN ROUTES INITIALIZING...");
const {
  getAttendanceSummary,
  getAllAttendance,
  addEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  getAnalytics,
  downloadAttendanceReport,
  updateCompany,
  createTicket,
  getCompanyTickets,
  getSpatialDensity,
  resetStrikes,
  resetEmployeePassword,
  getAuditLogs
} = require('../controllers/adminController');
const { getPendingRequests, processRequest } = require('../controllers/outLocationController');
const { getOffices, addOffice, deleteOffice, updateOffice } = require('../controllers/officeController');
const { adminActionLimiter } = require('../middleware/rateLimiters');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const { getNotices, createNotice, deleteNotice } = require('../controllers/noticeController');

// All admin routes are protected by JWT and role authorization
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'));
router.use(adminActionLimiter);

router.get('/audit-logs', getAuditLogs);
router.get('/summary', getAttendanceSummary);
router.get('/logs', getAllAttendance);
router.post('/employees', addEmployee);
router.get('/employees', getEmployees);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);
router.post('/employees/:id/reset-password', resetEmployeePassword);
router.post('/employees/:id/reset-strikes', resetStrikes);
router.get('/analytics', getAnalytics);
router.get('/reports/attendance', downloadAttendanceReport);
router.get('/requests/out-location', getPendingRequests);
router.post('/requests/out-location/:id/process', processRequest);
router.use('/sectors', require('./sectors'));

router.get('/offices', getOffices);
router.post('/offices', addOffice);
router.put('/offices/:id', updateOffice);
router.delete('/offices/:id', deleteOffice);

router.put('/company', updateCompany);

// Support Ticket Routes (Private Company Hub)
router.post('/tickets', createTicket);
router.get('/tickets', getCompanyTickets);
router.get('/spatial-density', getSpatialDensity);

// Notice & Holiday Management
router.get('/notices', getNotices);
router.post('/notices', createNotice);
router.delete('/notices/:id', deleteNotice);

module.exports = router;
