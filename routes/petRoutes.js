const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');

// Multer setup for image uploads
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Create a new pet with image upload
router.post('/', upload.single('profileImage'), async (req, res) => {
  try {
    const petData = req.body;
    
    // Defensive: If gender is an array, take the first value
    if (Array.isArray(petData.gender)) {
      petData.gender = petData.gender[0];
    }
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'breed', 'age', 'gender', 'location', 'description', 'userId'];
    const missingFields = requiredFields.filter(field => !petData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate gender
    if (!['Male', 'Female'].includes(petData.gender)) {
      return res.status(400).json({
        success: false,
        message: 'Gender must be either "Male" or "Female"'
      });
    }

    // Handle image upload
    if (req.file) {
      petData.profileImage = '/uploads/' + req.file.filename;
    } else {
      // Set a default image if none provided
      petData.profileImage = '/uploads/default-pet.jpg';
    }

    // Create and save the pet
    const pet = new Pet(petData);
    await pet.save();

    res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: pet
    });
  } catch (error) {
    console.error('Error creating pet:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating pet',
      error: error.message
    });
  }
});

// Get all pets (optionally filter by userId)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    let pets;
    if (userId) {
      pets = await Pet.find({ userId });
    } else {
      pets = await Pet.find();
    }
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single pet by ID
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a pet by ID
router.put('/:id', async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    res.json(pet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a pet by ID
router.delete('/:id', async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    res.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 