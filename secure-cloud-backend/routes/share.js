const express = require('express');
const router = express.Router();
const Share = require('../models/Share');
const File = require('../models/File');
const { authenticateUser } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const AuditLog = require('../models/AuditLog');
const { sendShareEmail } = require('../utils/email');

// ⬆️ Share File (generate shareable token)
router.post('/', authenticateUser, async (req, res) => {
  const { fileId, sharedWith, expiresAt } = req.body;
  const normalizedRecipient = sharedWith?.trim()?.toLowerCase();
  const sharedBy = req.user.email;
  const sharerUserId = req.user.userId;
  let file;

  try {
    if (!fileId || !normalizedRecipient) {
      return res.status(400).json({ message: 'fileId and sharedWith are required' });
    }

    if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
      return res.status(400).json({ message: 'Invalid expiresAt value' });
    }

    file = await File.findById(fileId);
    if (!file) {
      try {
        await AuditLog.create({
          user: sharerUserId,
          userEmail: sharedBy,
          action: 'SHARE_FILE_FAILED',
          success: false,
          ip: req.ip,
          meta: {
            reason: 'File not found',
            attemptedFileId: fileId,
            sharedWith: normalizedRecipient,
          },
        });
      } catch (auditErr) {
        console.error('Audit log failed:', auditErr.message);
      }
      return res.status(404).json({ message: 'File not found' });
    }

    const token = uuidv4();
    const share = new Share({
      fileId,
      sharedWith: normalizedRecipient,
      sharedBy,
      token,
      expiresAt
    });
    await share.save();

    try {
      await AuditLog.create({
        user: sharerUserId,
        userEmail: sharedBy,
        action: 'SHARE_FILE',
        ip: req.ip,
        meta: {
          fileId: file._id,
          originalName: file.originalName,
          sharedWith: normalizedRecipient,
          shareToken: token,
          expiresAt: expiresAt,
        },
      });
    } catch (auditErr) {
      console.error('Audit log failed:', auditErr.message);
    }

    const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/download/${token}`;

    let emailSent = true;
    try {
      await sendShareEmail(normalizedRecipient, sharedBy, file, frontendUrl);
    } catch (emailErr) {
      emailSent = false;
      console.error('Share email failed:', emailErr.message);
    }

    res.status(200).json({
      message: emailSent
        ? '✅ File shared successfully and notification sent.'
        : '✅ File shared successfully. Email notification could not be sent.',
      token: token,
      emailSent,
    });
  } catch (err) {
    console.error('Share route error:', err.message);
    try {
      await AuditLog.create({
        user: sharerUserId,
        userEmail: sharedBy,
        action: 'SHARE_FILE_FAILED',
        success: false,
        ip: req.ip,
        meta: {
          fileId: fileId,
          originalName: file?.originalName,
          sharedWith: normalizedRecipient,
          error: err.message,
        },
      });
    } catch (auditErr) {
      console.error('Audit log failed:', auditErr.message);
    }
    res.status(500).json({ message: '❌ Failed to share file', error: err.message });
  }
});

// ⬇️ Download shared file using token (SECURED)
router.get('/download/:token', authenticateUser, async (req, res) => {
  let share;
  try {
    share = await Share.findOne({ token: req.params.token }).populate('fileId');

    if (!share) {
      return res.status(404).json({ message: 'Invalid token' });
    }

    if (share.sharedWith !== req.user.email) {
      await AuditLog.create({
        user: req.user.userId,
        userEmail: req.user.email,
        action: 'DOWNLOAD_ACCESS_DENIED',
        success: false,
        ip: req.ip,
        meta: {
          reason: 'User is not the intended recipient',
          shareToken: req.params.token,
          intendedRecipient: share.sharedWith,
        },
      });
      return res.status(403).json({ message: 'Access Denied: You are not the intended recipient of this file.' });
    }

    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return res.status(403).json({ message: '⏰ Link expired' });
    }

    const filePath = path.resolve(share.fileId.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File missing on server' });
    }

    await AuditLog.create({
      user: req.user.userId,
      userEmail: req.user.email,
      action: 'DOWNLOAD_VIA_LINK',
      ip: req.ip,
      meta: {
        fileId: share.fileId._id,
        originalName: share.fileId.originalName,
        sharedBy: share.sharedBy,
        shareToken: req.params.token,
      },
    });

    res.download(filePath, share.fileId.originalName);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '❌ Failed to download file' });
  }
});

// GET /api/share/my-shares
router.get('/my-shares', authenticateUser, async (req, res) => {
  try {
    const myShares = await Share.find({ sharedBy: req.user.email })
      .populate('fileId', 'originalName');

    res.status(200).json(myShares);
  } catch (err) {
    console.error('Error fetching user shares:', err);
    res.status(500).json({ message: 'Failed to fetch your shared files' });
  }
});

// GET /api/share/received-shares - Shares where current user is recipient
router.get('/received-shares', authenticateUser, async (req, res) => {
  try {
    const receivedShares = await Share.find({ sharedWith: req.user.email })
      .populate('fileId', 'originalName uploadedBy')
      .sort({ _id: -1 });

    res.status(200).json(receivedShares);
  } catch (err) {
    console.error('Error fetching received shares:', err);
    res.status(500).json({ message: 'Failed to fetch received shares' });
  }
});

// DELETE /api/share/revoke/:shareId
router.delete('/revoke/:shareId', authenticateUser, async (req, res) => {
  try {
    const { shareId } = req.params;
    const share = await Share.findById(shareId);

    if (!share) {
      return res.status(404).json({ message: 'Share link not found.' });
    }

    if (share.sharedBy !== req.user.email) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to revoke this share.' });
    }

    await Share.findByIdAndDelete(shareId);

    await AuditLog.create({
      user: req.user.userId,
      userEmail: req.user.email,
      action: 'REVOKE_ACCESS',
      ip: req.ip,
      meta: {
        shareId: share._id,
        fileId: share.fileId,
        sharedWith: share.sharedWith
      }
    });

    res.status(200).json({ message: '✅ Access successfully revoked.' });

  } catch (err) {
    console.error('Error revoking access:', err);
    await AuditLog.create({
      user: req.user.userId,
      userEmail: req.user.email,
      action: 'REVOKE_ACCESS_FAILED',
      success: false,
      ip: req.ip,
      meta: {
        shareId: req.params.shareId,
        error: err.message
      }
    });
    res.status(500).json({ message: 'Failed to revoke access.' });
  }
});

// ✅ ADD THIS NEW ROUTE
// GET /api/share/details/:token - Fetches share details securely
router.get('/details/:token', authenticateUser, async (req, res) => {
  try {
    const share = await Share.findOne({ token: req.params.token }).populate('fileId', 'originalName');
    if (!share) {
      return res.status(404).json({ message: 'Share link not found.' });
    }
    // Security check: only the recipient can get the details
    if (share.sharedWith !== req.user.email) {
      return res.status(403).json({ message: 'Access Denied.' });
    }
    res.json({ originalName: share.fileId.originalName });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;