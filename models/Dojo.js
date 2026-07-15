const mongoose = require('mongoose');
const { encryptText, decryptText } = require('../utils/crypto');

const DojoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  address: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  mapUrl: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  latitude: {
    type: Number,
    required: false
  },
  longitude: {
    type: Number,
    required: false
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  }
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('Dojo', DojoSchema);
