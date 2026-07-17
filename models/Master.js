const mongoose = require('mongoose');
const { encryptText, decryptText } = require('../utils/crypto');

const MasterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  designation: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  dan: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  experience: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  bio: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  imageUrl: {
    type: String,
    required: true
  }
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Index for query performance optimization
MasterSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Master', MasterSchema);
