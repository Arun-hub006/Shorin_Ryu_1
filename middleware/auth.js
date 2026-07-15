const { decryptText } = require('../utils/crypto');

const protect = (req, res, next) => {
  if (req.cookies && req.cookies.admin_session) {
    try {
      const decrypted = decryptText(req.cookies.admin_session);
      const data = JSON.parse(decrypted);
      if (data.user === 'admin') {
        return next();
      }
    } catch (e) {
      console.error('Auth protect decryption failed:', e.message);
    }
  }
  res.status(401).json({ success: false, message: 'Access denied. Please log in as admin.' });
};

module.exports = { protect };
