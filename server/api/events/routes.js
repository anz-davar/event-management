const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticateToken = require('../../middleware/auth');

// Public route for accessing event details - no auth required
router.get('/public/:EventID', controller.getPublicEventById);

// Protected routes - require authentication
router.get('/', authenticateToken, controller.getEvents);
router.post('/', authenticateToken, controller.addEvent);
router.get('/:EventID', authenticateToken, controller.getEventById);
router.put('/:EventID', authenticateToken, controller.updateEvent);
router.delete('/:EventID', authenticateToken, controller.deleteEvent);

module.exports = router;