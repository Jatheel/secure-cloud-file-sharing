// This is the correct code for backend/routes/auditLog.js

const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticateUser } = require('../middleware/authMiddleware');

const isAdminRole = (roles = []) => roles.some((role) => role === 'admin' || role?.name === 'admin');

// GET /api/audit-log - Fetches audit logs with pagination and filtering
router.get('/', authenticateUser, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const query = {};

    if (!isAdminRole(req.user.roles)) {
      query.userEmail = req.user.email;
    } else if (req.query.userEmail) {
      query.userEmail = { $regex: req.query.userEmail, $options: 'i' };
    }

    if (req.query.action) {
      query.action = req.query.action;
    }

    const { startDate, endDate } = req.query;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endOfDay;
      }
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ message: 'Server error while fetching audit logs.' });
  }
});

module.exports = router;