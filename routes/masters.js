const express = require('express');
const router = express.Router();
const Master = require('../models/Master');
const { protect } = require('../middleware/auth');
const { upload, encryptUpload, processImage } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// GET all masters (Public)
router.get('/', async (req, res) => {
  try {
    const masters = await Master.find().sort({ createdAt: -1 });
    res.json(masters);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving masters', error: error.message });
  }
});

// GET individual master (Public)
router.get('/:id', async (req, res) => {
  try {
    const master = await Master.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ message: 'Master not found' });
    }
    res.json(master);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving master details', error: error.message });
  }
});

// POST new master (Protected)
router.post('/', protect, upload.single('image'), processImage, async (req, res) => {
  try {
    const { name, designation, dan, experience, bio } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Profile image is required' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const newMaster = new Master({
      name,
      designation,
      dan,
      experience,
      bio,
      imageUrl
    });

    const savedMaster = await newMaster.save();
    res.status(201).json(savedMaster);
  } catch (error) {
    console.error('Error creating master:', error);
    res.status(500).json({ message: 'Error creating master', error: error.message });
  }
});

// PUT update master (Protected)
router.put('/:id', protect, upload.single('image'), processImage, async (req, res) => {
  try {
    const { name, designation, dan, experience, bio } = req.body;
    const master = await Master.findById(req.params.id);

    if (!master) {
      return res.status(404).json({ message: 'Master not found' });
    }

    let imageUrl = master.imageUrl;
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    }

    master.name = name || master.name;
    master.designation = designation || master.designation;
    master.dan = dan || master.dan;
    master.experience = experience || master.experience;
    master.bio = bio || master.bio;
    master.imageUrl = imageUrl;

    const updatedMaster = await master.save();
    res.json(updatedMaster);
  } catch (error) {
    console.error('Error updating master:', error);
    res.status(500).json({ message: 'Error updating master', error: error.message });
  }
});

// DELETE master (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const master = await Master.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ message: 'Master not found' });
    }

    // Delete image file if it exists locally
    if (master.imageUrl && master.imageUrl.startsWith('/api/images/')) {
      const filename = master.imageUrl.split('/').pop();
      const imgPath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await Master.findByIdAndDelete(req.params.id);
    res.json({ message: 'Master deleted successfully' });
  } catch (error) {
    console.error('Error deleting master:', error);
    res.status(500).json({ message: 'Error deleting master', error: error.message });
  }
});

module.exports = router;
