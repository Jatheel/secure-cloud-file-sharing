const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const signToken = (user) => jwt.sign(
  { userId: user._id, email: user.email, roles: user.roles },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);

const isAdminRole = (roles = []) => roles.some((role) => role === 'admin' || role?.name === 'admin');

const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return 'user';
  return role.trim().toLowerCase();
};

exports.registerUser = async (req, res) => {
  const { email, password, role } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const requestedRole = normalizeRole(role);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const requiresApproval = requestedRole !== 'user';

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      roles: [requestedRole],
      approvalStatus: requiresApproval ? 'pending' : 'approved',
      requestedRole,
    });

    if (requiresApproval) {
      return res.status(202).json({
        message: `Your ${requestedRole} account is pending approval.`,
        approvalStatus: user.approvalStatus,
      });
    }

    const token = signToken(user);
    return res.status(201).json({
      message: 'Account created successfully',
      token,
      email: user.email,
      roles: user.roles,
      approvalStatus: user.approvalStatus,
    });
  } catch (err) {
    console.error('❌ Server error during registration:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  console.log('🛂 Login attempt:', normalizedEmail);

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('❌ User not found:', normalizedEmail);
      return res.status(401).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid password' });
    }

    if (user.approvalStatus === 'pending') {
      return res.status(403).json({
        message: 'Your account is pending approval. Please wait for an admin to approve it.',
        approvalStatus: user.approvalStatus,
      });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({
        message: 'Your account was rejected. Please contact an administrator.',
        approvalStatus: user.approvalStatus,
      });
    }

    const token = signToken(user);

    console.log('✅ Login successful:', normalizedEmail);

    res.json({
      token,
      email: user.email,
      roles: user.roles,
      approvalStatus: user.approvalStatus,
    });
  } catch (err) {
    console.error('❌ Server error during login:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPendingUsers = async (req, res) => {
  try {
    if (!isAdminRole(req.user.roles)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find({ approvalStatus: 'pending' }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending users', error: err.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    if (!isAdminRole(req.user.roles)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { approvalStatus: 'approved' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User approved successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve user', error: err.message });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    if (!isAdminRole(req.user.roles)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { approvalStatus: 'rejected' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User rejected successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject user', error: err.message });
  }
};