const express = require('express');
const router = express.Router();
const { submitLeaveRequest, getMyLeaveRequests, getAllLeaveRequests, processLeaveRequest } = require('../controllers/leaveController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Employee routes
router.post('/submit', submitLeaveRequest);
router.get('/my', getMyLeaveRequests);

// Admin routes
router.get('/all', authorizeRoles('ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), getAllLeaveRequests);
router.post('/:id/process', authorizeRoles('ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), processLeaveRequest);

module.exports = router;
