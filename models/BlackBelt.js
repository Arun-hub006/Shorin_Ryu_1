const mongoose = require('mongoose');
const { encryptText, decryptText } = require('../utils/crypto');

const BlackBeltSchema = new mongoose.Schema({
  name: {
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
  specialization: {
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

module.exports = mongoose.model('BlackBelt', BlackBeltSchema);
