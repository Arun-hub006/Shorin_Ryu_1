const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { encryptBuffer } = require('../utils/crypto');

// Create uploads folder outside of the public directory for security
const uploadDir = path.join(__dirname, '../uploads');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, JPG, PNG and WEBP files are allowed.'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: fileFilter
});

// Custom middleware to encrypt upload and write to secure directory
const encryptUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + path.extname(req.file.originalname) + '.enc';
    const filepath = path.join(uploadDir, filename);

    // Encrypt the file buffer
    const encryptedData = encryptBuffer(req.file.buffer);

    // Write file to secure disk storage
    fs.writeFileSync(filepath, encryptedData);

    // Overwrite req.file properties for simple routing integration
    req.file.filename = filename;
    req.file.path = filepath;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upload,
  encryptUpload
};
