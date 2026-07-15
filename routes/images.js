const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { decryptBuffer } = require('../utils/crypto');

router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(__dirname, '../uploads', filename);

  // Check if file exists
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ message: 'Image not found' });
  }

  try {
    // Read encrypted file from disk
    const encryptedData = fs.readFileSync(filepath);
    
    // Decrypt the file buffer
    const decryptedData = decryptBuffer(encryptedData);

    // Get correct MIME type based on file extension
    // Filename format is: timestamp-random.ext.enc
    const parts = filename.split('.');
    let ext = '';
    if (parts.length >= 2) {
      ext = parts[parts.length - 2].toLowerCase(); // Get the original extension before '.enc'
    }

    let contentType = 'application/octet-stream';
    if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(decryptedData);
  } catch (error) {
    console.error('Error serving encrypted image:', error);
    res.status(500).json({ message: 'Error processing image decryption' });
  }
});

module.exports = router;
