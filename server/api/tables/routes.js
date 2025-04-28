const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticateToken = require('../../middleware/auth');

router.get('/', authenticateToken, controller.getTables);
router.get('/hall/:hallId', authenticateToken, controller.getTablesByHallId);
router.post('/', authenticateToken, controller.addTable);
router.get('/:TableID', authenticateToken, controller.getTableById);
router.put('/:TableID', authenticateToken, controller.updateTable);
router.delete('/:TableID', authenticateToken, controller.deleteTable);

module.exports = router;