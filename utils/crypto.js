const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// Ensure key is exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'ponmar_karate_discipline_strength'; // 32 chars
const KEY = Buffer.from(ENCRYPTION_KEY.substring(0, 32));
const IV_LENGTH = 16; // 128 bits

// Encrypt Text
const encryptText = (text) => {
  if (!text) return text;
  // If text already looks encrypted (has a colon and hex formatting), don't encrypt again
  if (typeof text === 'string' && text.includes(':') && text.split(':')[0].length === 32) {
    return text;
  }
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// Decrypt Text
const decryptText = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  try {
    // Check if it's formatted as iv:ciphertext
    const parts = encryptedText.split(':');
    if (parts.length !== 2 || parts[0].length !== 32) {
      return encryptedText; // Return raw text if it was not encrypted (legacy or plain text)
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // If decryption fails, log and fallback to raw value
    console.error('Decryption failed, returning raw string:', err.message);
    return encryptedText;
  }
};

// Encrypt Buffer (for files)
const encryptBuffer = (buffer) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, encrypted]); // Prepend IV (first 16 bytes)
};

// Decrypt Buffer (for files)
const decryptBuffer = (buffer) => {
  try {
    const iv = buffer.subarray(0, IV_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  } catch (err) {
    console.error('Buffer decryption failed:', err.message);
    return buffer; // Return original if decryption fails
  }
};

module.exports = {
  encryptText,
  decryptText,
  encryptBuffer,
  decryptBuffer
};
