const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const File = require('../models/File');
const blockchain = require('../utils/blockchain');
const path = require('path');
const fs = require('fs');
const { authenticateUser } = require('../middleware/authMiddleware'); // 🔐 Authentication
const checkPermission = require('../middleware/roleMiddleware');     // 🔒 Role-based authorization
const AuditLog = require('../models/AuditLog'); // ✅ Import the AuditLog model

// ✅ Upload File (requires 'upload' permission)
router.post(
  '/',
  authenticateUser,
  checkPermission('upload'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { email } = req.body; // Comes from the frontend form
      const { userId } = req.user; // Comes from JWT

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = new File({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        uploadedBy: email
      });

      await file.save();

      // Your existing blockchain logic
      const block = blockchain.addBlock({
        fileId: file._id,
        filename: file.filename,
        uploadedBy: file.uploadedBy,
        timestamp: file.timestamp
      });
      console.log('🔗 New block added to blockchain:', block);

      // ✅ Log the successful UPLOAD action
      await AuditLog.create({
        user: userId,
        userEmail: email,
        action: 'UPLOAD',
        ip: req.ip,
        meta: {
          fileId: file._id,
          originalName: file.originalName,
          size: req.file.size
        }
      });

      res.status(200).json({
        message: '✅ File uploaded successfully',
        fileInfo: file,
        blockchain: block
      });
    } catch (err) {
      // ✅ Log the FAILED upload action
      try {
        await AuditLog.create({
          user: req.user?.userId,
          userEmail: req.user?.email,
          action: 'UPLOAD_FAILED',
          success: false,
          ip: req.ip,
          meta: {
            originalName: req.file?.originalname,
            error: err.message
          }
        });
      } catch (auditErr) {
        console.error('Audit log failed:', auditErr.message);
      }
      res.status(500).json({ message: '❌ Upload failed', error: err.message });
    }
  }
);

// ✅ View Blockchain (public)
router.get('/chain', (req, res) => {
  res.json(blockchain.chain);
});

// ✅ List Uploaded Files (auth only)
router.get('/list', authenticateUser, async (req, res) => {
  try {
    const files = await File.find().sort({ timestamp: -1 });
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to fetch files', error: err.message });
  }
});

// ✅ Download File (requires 'download' permission)
router.get('/download/:id', authenticateUser, checkPermission('download'), async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = path.resolve(file.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File missing on server' });
    }

    // ✅ Log the successful DOWNLOAD_DIRECT action
    await AuditLog.create({
      user: req.user.userId,
      userEmail: req.user.email,
      action: 'DOWNLOAD_DIRECT',
      ip: req.ip,
      meta: {
        fileId: file._id,
        originalName: file.originalName
      }
    });

    res.download(filePath, file.originalName);
  } catch (err) {
    // ✅ Log the FAILED download action
    await AuditLog.create({
      user: req.user.userId,
      userEmail: req.user.email,
      action: 'DOWNLOAD_DIRECT_FAILED',
      success: false,
      ip: req.ip,
      meta: {
        fileId: req.params.id,
        error: err.message
      }
    });
    res.status(500).json({ message: '❌ Download failed', error: err.message });
  }
});

// ✅ DELETE /api/upload/delete/:id – requires 'revoke' permission
router.delete('/delete/:id', authenticateUser, checkPermission('revoke'), async (req, res) => {
  let file;
  try {
    file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = path.resolve(file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // remove the file from filesystem
    }

    await File.findByIdAndDelete(req.params.id); // remove from DB

    // ✅ Log the successful DELETE action
    await AuditLog.create({
      user: req.user.userId,
      userEmail: req.user.email,
      action: 'DELETE_FILE',
      ip: req.ip,
      meta: {
        fileId: file._id,
        originalName: file.originalName
      }
    });

    res.status(200).json({ message: '🗑️ File successfully deleted' });
  } catch (err) {
    console.error('❌ Delete error:', err.message);
    // ✅ Log the FAILED delete action
    try {
      await AuditLog.create({
        user: req.user.userId,
        userEmail: req.user.email,
        action: 'DELETE_FILE_FAILED',
        success: false,
        ip: req.ip,
        meta: {
          fileId: req.params.id,
          originalName: file?.originalName,
          error: err.message
        }
      });
    } catch (auditErr) {
      console.error('Audit log failed:', auditErr.message);
    }
    res.status(500).json({ message: '❌ Failed to delete file', error: err.message });
  }
});

// Normalize upload middleware errors (e.g., unsupported file type) to JSON responses.
router.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err.message === 'Unsupported file type') {
    return res.status(400).json({
      message: 'Unsupported file type. Allowed: .pdf, .docx, .jpg, .png'
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: err.message || 'File upload error'
    });
  }

  return res.status(500).json({
    message: 'Upload middleware failed',
    error: err.message
  });
});

module.exports = router;