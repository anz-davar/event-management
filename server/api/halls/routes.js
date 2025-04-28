const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticateToken = require('../../middleware/auth');

router.get('/', authenticateToken, controller.getHalls);
router.get('/:hallId', authenticateToken, controller.getHallNameById);
router.post('/', authenticateToken, controller.createHall);
router.put('/', authenticateToken, controller.updateHall);
router.delete('/:hallId', authenticateToken, controller.deleteHall);

module.exports = router;