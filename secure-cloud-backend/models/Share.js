const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  sharedWith: {
    type: String,
    required: true
  },
  sharedBy: {
    type: String,
    required: true
  },
  token: {
    type: String,
    unique: true,
    required: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Share', shareSchema);