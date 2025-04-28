const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticateToken = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/', controller.getGuests);
router.post('/', controller.addGuest);
router.put('/', controller.updateGuest);
router.delete('/:GuestID', controller.deleteGuest);

module.exports = router;