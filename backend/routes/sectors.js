const express = require('express');
const router = express.Router();
const { getSectors, createSector, deleteSector, updateSector } = require('../controllers/sectorController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All sector routes require authentication
router.use(authenticateToken);

// GET /api/sectors is accessible to all authenticated users (including employees for dropdowns)
router.get('/', getSectors);

// POST, PUT and DELETE require admin privileges
router.post('/', authorizeRoles('ADMIN', 'COMPANY_ADMIN'), createSector);
router.put('/:id', authorizeRoles('ADMIN', 'COMPANY_ADMIN'), updateSector);
router.delete('/:id', authorizeRoles('ADMIN', 'COMPANY_ADMIN'), deleteSector);

module.exports = router;
