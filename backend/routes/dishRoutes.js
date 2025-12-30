const express = require('express');
const router = express.Router();
const { auth, isOwner } = require('../middleware/auth');
const Dish = require('../models/Dish');

// Get all dishes (public)
router.get('/', async (req, res) => {
  try {
    const dishes = await Dish.find({ isAvailable: true })
      .sort({ popularity: -1 })
      .limit(50);
    
    res.json({
      success: true,
      dishes
    });
    
  } catch (error) {
    console.error('Get dishes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get dish by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    
    if (!dish) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dish not found' 
      });
    }
    
    res.json({
      success: true,
      dish
    });
    
  } catch (error) {
    console.error('Get dish error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Protected routes require authentication
router.use(auth);

// Create dish (owners only)
router.post('/', isOwner, async (req, res) => {
  try {
    const dishData = req.body;
    dishData.restaurantId = req.user.id;
    
    const dish = new Dish(dishData);
    await dish.save();
    
    res.status(201).json({
      success: true,
      dish
    });
    
  } catch (error) {
    console.error('Create dish error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update dish (owners only)
router.put('/:id', isOwner, async (req, res) => {
  try {
    const dish = await Dish.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!dish) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dish not found' 
      });
    }
    
    // Check if user owns this dish
    if (dish.restaurantId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.json({
      success: true,
      dish
    });
    
  } catch (error) {
    console.error('Update dish error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Delete dish (owners only)
router.delete('/:id', isOwner, async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    
    if (!dish) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dish not found' 
      });
    }
    
    // Check if user owns this dish
    if (dish.restaurantId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    await dish.deleteOne();
    
    res.json({
      success: true,
      message: 'Dish deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete dish error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get restaurant dishes (owners only)
router.get('/restaurant/mine', isOwner, async (req, res) => {
  try {
    const dishes = await Dish.find({ restaurantId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      dishes
    });
    
  } catch (error) {
    console.error('Get restaurant dishes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;