const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticateToken = require('../../middleware/auth');

router.get('/', authenticateToken, controller.getSeatingArrangements);
router.post('/', authenticateToken, controller.createSeatingArrangement);
router.post('/optimize/:eventId', authenticateToken, controller.optimizeSeatingArrangement);
router.get('/:SeatingArrangementID', authenticateToken, controller.getSeatingArrangementById);
router.put('/:SeatingArrangementID', authenticateToken, controller.updateSeatingArrangement);
router.delete('/:SeatingArrangementID', authenticateToken, controller.removeSeatingArrangement);

module.exports = router;