const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticateToken = require('../../middleware/auth');

// Get all tables assigned to an event
router.get('/:eventId', authenticateToken, controller.getEventTables);
// Assign a table to an event
router.post('/', authenticateToken, controller.assignTableToEvent);
// Remove a table from an event
router.delete('/:eventId/:tableId', authenticateToken, controller.removeTableFromEvent);

module.exports = router;
