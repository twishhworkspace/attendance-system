const express = require('express');
const router = express.Router();
const { submitRequest, getMyRequests } = require('../controllers/outLocationController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/submit', submitRequest);
router.get('/my', getMyRequests);

module.exports = router;
