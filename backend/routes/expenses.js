const express = require('express');
const router = express.Router();
const {
  getCompanies,
  createCompany,
  updateCompany,
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  adminGetEmployees,
  adminGetEmployeeCompanies,
  adminGetEmployeeEntries,
  adminUpdateEntryStatus
} = require('../controllers/expenseController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All expense routes require authentication
router.use(authenticateToken);

// Employee routes
router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.put('/companies/:companyId', updateCompany);
router.get('/companies/:companyId/entries', getEntries);
router.post('/companies/:companyId/entries', addEntry);
router.put('/entries/:entryId', updateEntry);
router.delete('/entries/:entryId', deleteEntry);

// Admin-specific routes (Restricted to organization managers/admins)
router.get('/admin/employees', authorizeRoles('ADMIN', 'COMPANY_ADMIN'), adminGetEmployees);
router.get('/admin/employees/:userId/companies', authorizeRoles('ADMIN', 'COMPANY_ADMIN'), adminGetEmployeeCompanies);
router.get('/admin/companies/:companyId/entries', authorizeRoles('ADMIN', 'COMPANY_ADMIN'), adminGetEmployeeEntries);
router.put('/admin/entries/:entryId/status', authorizeRoles('ADMIN', 'COMPANY_ADMIN'), adminUpdateEntryStatus);

module.exports = router;
