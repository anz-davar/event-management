const express= require('express');
const router = express.Router();
const controller = require('./controller');
const authenticateToken = require('../../middleware/auth');

router.get('/', authenticateToken, controller.getUsers);
// router.post('/', controller.registerUser);
router.post('/register', controller.registerUser);
router.post('/login', controller.loginUser); // expects { Username, Password } in body
router.get('/:UserID', authenticateToken, controller.getUserById);
router.put('/:UserID', authenticateToken, controller.updateUser);
router.delete('/:UserID', authenticateToken, controller.deleteUser);

module.exports = router;
