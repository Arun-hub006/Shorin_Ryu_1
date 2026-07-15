const express = require('express');
const router = express.Router();
const BlackBelt = require('../models/BlackBelt');
const { protect } = require('../middleware/auth');
const { upload, encryptUpload } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// GET all black belts (Public)
router.get('/', async (req, res) => {
  try {
    const blackbelts = await BlackBelt.find().sort({ createdAt: -1 });
    res.json(blackbelts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving black belts', error: error.message });
  }
});

// GET individual black belt (Public)
router.get('/:id', async (req, res) => {
  try {
    const blackbelt = await BlackBelt.findById(req.params.id);
    if (!blackbelt) {
      return res.status(404).json({ message: 'Black belt not found' });
    }
    res.json(blackbelt);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving black belt details', error: error.message });
  }
});

// POST new black belt (Protected)
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { name, dan, specialization, experience, bio } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Profile image is required' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const newBlackBelt = new BlackBelt({
      name,
      dan,
      specialization,
      experience,
      bio,
      imageUrl
    });

    const savedBlackBelt = await newBlackBelt.save();
    res.status(201).json(savedBlackBelt);
  } catch (error) {
    console.error('Error creating black belt:', error);
    res.status(500).json({ message: 'Error creating black belt', error: error.message });
  }
});

// PUT update black belt (Protected)
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const { name, dan, specialization, experience, bio } = req.body;
    const blackbelt = await BlackBelt.findById(req.params.id);

    if (!blackbelt) {
      return res.status(404).json({ message: 'Black belt not found' });
    }

    let imageUrl = blackbelt.imageUrl;
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    }

    blackbelt.name = name || blackbelt.name;
    blackbelt.dan = dan || blackbelt.dan;
    blackbelt.specialization = specialization || blackbelt.specialization;
    blackbelt.experience = experience || blackbelt.experience;
    blackbelt.bio = bio || blackbelt.bio;
    blackbelt.imageUrl = imageUrl;

    const updatedBlackBelt = await blackbelt.save();
    res.json(updatedBlackBelt);
  } catch (error) {
    console.error('Error updating black belt:', error);
    res.status(500).json({ message: 'Error updating black belt', error: error.message });
  }
});

// DELETE black belt (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const blackbelt = await BlackBelt.findById(req.params.id);
    if (!blackbelt) {
      return res.status(404).json({ message: 'Black belt not found' });
    }

    // Delete image file if it exists locally
    if (blackbelt.imageUrl && blackbelt.imageUrl.startsWith('/api/images/')) {
      const filename = blackbelt.imageUrl.split('/').pop();
      const imgPath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await BlackBelt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Black belt deleted successfully' });
  } catch (error) {
    console.error('Error deleting black belt:', error);
    res.status(500).json({ message: 'Error deleting black belt', error: error.message });
  }
});

module.exports = router;
