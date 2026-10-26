const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  loginUser,
  registerUser,
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminStats
} = require('../controllers/authController');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');

// Rate limiting for auth endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes.' }
});

router.post('/login', authLimiter, loginUser);
router.post('/register', authLimiter, registerUser);

// Admin user management & stats
router.get('/pending', authenticateUser, getPendingUsers);
router.get('/users', authenticateUser, getAllUsers);
router.get('/stats', authenticateUser, getAdminStats);
router.patch('/approve/:userId', authenticateUser, approveUser);
router.patch('/reject/:userId', authenticateUser, rejectUser);
router.patch('/user/:userId/role', authenticateUser, updateUserRole);
router.delete('/user/:userId', authenticateUser, deleteUser);

module.exports = router;