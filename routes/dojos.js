const express = require('express');
const router = express.Router();
const Dojo = require('../models/Dojo');
const { protect } = require('../middleware/auth');
const { upload, encryptUpload, processImage } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Helper to extract coordinates from Google Maps URLs
const extractCoords = (url) => {
  if (!url) return null;
  // Format: q=lat,lng or @lat,lng
  let match = url.match(/[?&]q=([\d.-]+),([\d.-]+)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  match = url.match(/@([\d.-]+),([\d.-]+)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return null;
};

// GET all dojo locations (Public)
router.get('/', async (req, res) => {
  try {
    const dojos = await Dojo.find().sort({ createdAt: 1 });
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=60');
    res.json(dojos);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving dojo locations', error: error.message });
  }
});

// GET individual dojo location (Public)
router.get('/:id', async (req, res) => {
  try {
    const dojo = await Dojo.findById(req.params.id);
    if (!dojo) {
      return res.status(404).json({ message: 'Dojo location not found' });
    }
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=60');
    res.json(dojo);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving dojo details', error: error.message });
  }
});

// POST new dojo location (Protected)
router.post('/', protect, upload.none(), async (req, res) => {
  try {
    const { name, address, phone, mapUrl, description, latitude, longitude } = req.body;
    
    // Compute coords if not explicitly provided
    let finalLat = latitude ? parseFloat(latitude) : null;
    let finalLng = longitude ? parseFloat(longitude) : null;

    if (finalLat === null || finalLng === null || isNaN(finalLat) || isNaN(finalLng)) {
      const coords = extractCoords(mapUrl);
      if (coords) {
        finalLat = coords.lat;
        finalLng = coords.lng;
      }
    }

    const newDojo = new Dojo({
      name,
      address,
      phone,
      mapUrl,
      latitude: finalLat,
      longitude: finalLng,
      description
    });

    const savedDojo = await newDojo.save();
    res.status(201).json(savedDojo);
  } catch (error) {
    console.error('Error creating dojo location:', error);
    res.status(500).json({ message: 'Error creating dojo location', error: error.message });
  }
});

// PUT update dojo location (Protected)
router.put('/:id', protect, upload.none(), async (req, res) => {
  try {
    const { name, address, phone, mapUrl, description, latitude, longitude } = req.body;
    const dojo = await Dojo.findById(req.params.id);

    if (!dojo) {
      return res.status(404).json({ message: 'Dojo location not found' });
    }

    // Compute coords if not explicitly provided or mapUrl has changed
    let finalLat = latitude !== undefined && latitude !== '' ? parseFloat(latitude) : null;
    let finalLng = longitude !== undefined && longitude !== '' ? parseFloat(longitude) : null;

    if ((finalLat === null || finalLng === null || isNaN(finalLat) || isNaN(finalLng)) && mapUrl) {
      const coords = extractCoords(mapUrl);
      if (coords) {
        finalLat = coords.lat;
        finalLng = coords.lng;
      }
    }

    dojo.name = name || dojo.name;
    dojo.address = address || dojo.address;
    dojo.phone = phone || dojo.phone;
    dojo.mapUrl = mapUrl || dojo.mapUrl;
    dojo.description = description || dojo.description;
    
    if (finalLat !== null && !isNaN(finalLat)) dojo.latitude = finalLat;
    if (finalLng !== null && !isNaN(finalLng)) dojo.longitude = finalLng;

    const updatedDojo = await dojo.save();
    res.json(updatedDojo);
  } catch (error) {
    console.error('Error updating dojo location:', error);
    res.status(500).json({ message: 'Error updating dojo location', error: error.message });
  }
});

// DELETE dojo location (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const dojo = await Dojo.findById(req.params.id);
    if (!dojo) {
      return res.status(404).json({ message: 'Dojo location not found' });
    }

    await Dojo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Dojo location deleted successfully' });
  } catch (error) {
    console.error('Error deleting dojo location:', error);
    res.status(500).json({ message: 'Error deleting dojo location', error: error.message });
  }
});

module.exports = router;
