const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const File = require('../models/File');
const Share = require('../models/Share');
const blockchain = require('../utils/blockchain');
const path = require('path');
const fs = require('fs');
const { authenticateUser } = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/roleMiddleware');
const AuditLog = require('../models/AuditLog');
const { encryptFileInPlace, decryptFileToBuffer } = require('../utils/encryption');

const isAdminRole = (roles = []) => roles.some((role) => role === 'admin' || role?.name === 'admin');

// ✅ Upload File (requires 'upload' permission)
router.post(
  '/',
  authenticateUser,
  checkPermission('upload'),
  upload.single('file'),
  async (req, res) => {
    try {
      const uploaderEmail = req.user?.email || req.body?.email;
      const userId = req.user?.userId;

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Encrypt file at rest using AES-256-CBC
      encryptFileInPlace(req.file.path);

      const file = new File({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        uploadedBy: uploaderEmail,
        size: req.file.size,
        isEncrypted: true
      });

      await file.save();

      // Record transaction on immutable blockchain audit ledger
      const block = blockchain.addBlock({
        event: 'FILE_UPLOAD',
        fileId: file._id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        uploadedBy: file.uploadedBy,
        isEncrypted: true,
        timestamp: file.timestamp
      });
      console.log('🔗 New block added to blockchain:', block);

      // Log successful upload in MongoDB audit log
      await AuditLog.create({
        user: userId,
        userEmail: uploaderEmail,
        action: 'UPLOAD',
        ip: req.ip,
        meta: {
          fileId: file._id,
          originalName: file.originalName,
          size: file.size,
          isEncrypted: true,
          blockIndex: block.index,
          blockHash: block.hash
        }
      });

      res.status(200).json({
        message: '✅ File encrypted and uploaded successfully',
        fileInfo: file,
        blockchain: block
      });
    } catch (err) {
      console.error('Upload route error:', err.message);
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

// ✅ View Blockchain (public / auth)
router.get('/chain', (req, res) => {
  res.json({
    chain: blockchain.chain,
    isValid: blockchain.isChainValid(),
    totalBlocks: blockchain.chain.length
  });
});

// ✅ List Uploaded Files for Current User (My Files)
router.get('/my-files', authenticateUser, async (req, res) => {
  try {
    const query = { uploadedBy: req.user.email };
    const files = await File.find(query).sort({ timestamp: -1 });
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to fetch my files', error: err.message });
  }
});

// ✅ List All Uploaded Files (auth only)
router.get('/list', authenticateUser, async (req, res) => {
  try {
    let query = {};
    if (!isAdminRole(req.user.roles)) {
      query = { uploadedBy: req.user.email };
    }
    const files = await File.find(query).sort({ timestamp: -1 });
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

    // Only owner or admin can download directly; others must use a share link
    if (file.uploadedBy !== req.user.email && !isAdminRole(req.user.roles)) {
      await AuditLog.create({
        user: req.user.userId,
        userEmail: req.user.email,
        action: 'DOWNLOAD_ACCESS_DENIED',
        success: false,
        ip: req.ip,
        meta: {
          reason: 'User is not the file owner',
          fileId: file._id,
          originalName: file.originalName
        }
      });
      return res.status(403).json({ message: 'Access denied: You can only download your own files directly' });
    }

    const filePath = path.resolve(file.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File missing on server' });
    }

    // Record on blockchain
    blockchain.addBlock({
      event: 'DIRECT_DOWNLOAD',
      fileId: file._id,
      originalName: file.originalName,
      downloadedBy: req.user.email,
      timestamp: new Date().toISOString()
    });

    // Log the successful DOWNLOAD_DIRECT action
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

    // Decrypt if encrypted
    if (file.isEncrypted) {
      const decrypted = decryptFileToBuffer(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      return res.send(decrypted);
    }

    res.download(filePath, file.originalName);
  } catch (err) {
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

// ✅ DELETE /api/upload/delete/:id – owner or admin only
router.delete('/delete/:id', authenticateUser, async (req, res) => {
  let file;
  try {
    file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Only owner or admin can delete
    if (file.uploadedBy !== req.user.email && !isAdminRole(req.user.roles)) {
      return res.status(403).json({ message: 'Access denied: You can only delete your own files' });
    }

    const filePath = path.resolve(file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // remove the file from filesystem
    }

    await File.findByIdAndDelete(req.params.id); // remove from DB
    await Share.deleteMany({ fileId: file._id }); // invalidate all share links for this file

    // Record on blockchain
    blockchain.addBlock({
      event: 'FILE_DELETE',
      fileId: file._id,
      originalName: file.originalName,
      deletedBy: req.user.email,
      timestamp: new Date().toISOString()
    });

    // Log successful DELETE action
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

// Normalize upload middleware errors to JSON responses
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