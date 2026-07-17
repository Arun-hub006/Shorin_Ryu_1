const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Dojo = require('../models/Dojo');
const { protect } = require('../middleware/auth');

// GET all registrations (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('selectedDojo', 'name address')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving registrations', error: error.message });
  }
});

// GET unread count (Protected)
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Registration.countDocuments({ status: 'unread' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving unread count', error: error.message });
  }
});

// POST a new registration (Public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, age, experience, selectedDojo } = req.body;

    if (!name || !email || !phone || !age || !experience) {
      return res.status(400).json({ message: 'All registration fields are required' });
    }

    if (selectedDojo) {
      // Verify dojo exists
      const dojo = await Dojo.findById(selectedDojo);
      if (!dojo) {
        return res.status(404).json({ message: 'Selected Dojo location not found' });
      }
    }

    const newRegistration = new Registration({
      name,
      email,
      phone,
      age: parseInt(age),
      experience,
      selectedDojo: selectedDojo || undefined,
      status: 'unread'
    });

    const savedRegistration = await newRegistration.save();
    res.status(201).json({ success: true, data: savedRegistration });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting registration', error: error.message });
  }
});

// PATCH mark registration as read (Protected)
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.status = 'read';
    const updated = await registration.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// DELETE a registration (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await Registration.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting registration', error: error.message });
  }
});

module.exports = router;
