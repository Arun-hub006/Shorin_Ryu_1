const multer = require('multer');
const sharp = require('sharp');
const { MAX_DIMENSION, TARGET_SIZE_KB, QUALITY_RANGE } = require('../config/imageConfig');
const path = require('path');
const fs = require('fs');
const { encryptBuffer } = require('../utils/crypto');

// Create uploads folder outside of the public directory for security
const uploadDir = process.env.NODE_ENV === 'production'
  ? '/tmp'
  : path.join(__dirname, '../uploads');

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

// Process image: resize, compress dynamically to target 100 - 150 KB with high face clarity
const processImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    // 75 KB binary converts to ~100 KB Base64 text in database
    // 112.5 KB binary converts to ~150 KB Base64 text in database
    const targetMinBytes = 75 * 1024; 
    const targetMaxBytes = 112.5 * 1024; 

    let currentQuality = 80;
    let currentDim = MAX_DIMENSION || 800;
    let attempts = 0;
    let processedBuffer = null;

    // Iteratively adjust quality/dimensions to target the 100 - 150 KB range
    while (attempts < 5) {
      processedBuffer = await sharp(req.file.buffer)
        .rotate()
        .resize({
          width: currentDim,
          height: currentDim,
          fit: 'inside',
          position: 'entropy'
        })
        .jpeg({ quality: currentQuality, mozjpeg: true })
        .toBuffer();

      const size = processedBuffer.length;

      if (size >= targetMinBytes && size <= targetMaxBytes) {
        break; // Falls in the 100-150 KB range
      }

      if (size > targetMaxBytes) {
        if (currentQuality > 60) {
          currentQuality = Math.max(60, currentQuality - 10);
        } else {
          currentDim = Math.max(400, Math.round(currentDim * 0.8));
        }
      } else {
        if (currentQuality < 95) {
          currentQuality = Math.min(95, currentQuality + 5);
        } else if (currentDim < 1200) {
          currentDim = Math.min(1200, Math.round(currentDim * 1.2));
        } else {
          break; // Quality and dimensions are maxed out
        }
      }
      attempts++;
    }

    req.file.buffer = processedBuffer;
    req.file.mimetype = 'image/jpeg';
    next();
  } catch (err) {
    next(err);
  }
};

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
  encryptUpload,
  processImage
};
