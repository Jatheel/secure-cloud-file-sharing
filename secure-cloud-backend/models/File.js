const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: String,          // e.g., file-1690912954-3829.pdf
  originalName: String,      // e.g., resume.pdf
  path: String,              // e.g., uploads/file-xyz.pdf
  uploadedBy: String,        // e.g., admin@example.com
  size: {
    type: Number,
    default: 0
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('File', fileSchema);