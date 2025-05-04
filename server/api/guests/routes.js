const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticateToken = require('../../middleware/auth');

// Public routes for guest self-registration - no auth required
router.post('/public', controller.addPublicGuest);
router.post('/public/family', controller.addPublicFamilyGuests);

// Protected routes - require authentication
router.use(authenticateToken);

router.get('/', controller.getGuests);
router.post('/', controller.addGuest);
router.put('/', controller.updateGuest);
router.delete('/:GuestID', controller.deleteGuest);

module.exports = router;