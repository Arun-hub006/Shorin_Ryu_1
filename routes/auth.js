const express = require('express');
const router = express.Router();
const { encryptText, decryptText } = require('../utils/crypto');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'ponmar') {
    // Encrypt the session data
    const sessionPayload = JSON.stringify({ user: 'admin', timestamp: Date.now() });
    const encryptedSession = encryptText(sessionPayload);

    // Set a session-only cookie
    res.cookie('admin_session', encryptedSession, {
      httpOnly: true
    });
    return res.json({ success: true, message: 'Logged in successfully' });
  }

  return res.status(401).json({ success: false, message: 'Invalid username or password' });
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_session');
  return res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/check', (req, res) => {
  if (req.cookies && req.cookies.admin_session) {
    try {
      const decrypted = decryptText(req.cookies.admin_session);
      const data = JSON.parse(decrypted);
      if (data.user === 'admin') {
        return res.json({ authenticated: true });
      }
    } catch (e) {
      console.error('Session decryption failed:', e.message);
    }
  }
  return res.json({ authenticated: false });
});

module.exports = router;
