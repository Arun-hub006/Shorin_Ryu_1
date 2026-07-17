const mongoose = require('mongoose');
const { encryptText, decryptText } = require('../utils/crypto');

const RegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  email: {
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
  age: {
    type: Number,
    required: true
  },
  experience: {
    type: String,
    required: true,
    trim: true,
    get: decryptText,
    set: encryptText
  },
  selectedDojo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dojo'
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  }
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Indexes for query performance optimization
RegistrationSchema.index({ createdAt: -1 });
RegistrationSchema.index({ status: 1 });

module.exports = mongoose.model('Registration', RegistrationSchema);
