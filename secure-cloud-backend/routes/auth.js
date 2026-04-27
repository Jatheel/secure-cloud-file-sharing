const express = require('express');
const { loginUser, registerUser, getPendingUsers, approveUser, rejectUser } = require('../controllers/authController');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/pending', authenticateUser, getPendingUsers);
router.patch('/approve/:userId', authenticateUser, approveUser);
router.patch('/reject/:userId', authenticateUser, rejectUser);

module.exports = router;