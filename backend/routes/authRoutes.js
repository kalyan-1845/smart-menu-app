const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Owner = require('../models/Owner');

// Super Admin Login
router.post('/super-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for super admin credentials
    if (email === 'admin@bitebox.com' && password === 'admin123') {
      const token = jwt.sign(
        { 
          id: 'super-admin-001',
          email: 'admin@bitebox.com',
          role: 'super-admin',
          name: 'System Administrator'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        token,
        user: {
          id: 'super-admin-001',
          email: 'admin@bitebox.com',
          name: 'System Administrator',
          role: 'super-admin'
        }
      });
    }
    
    // Regular owner login
    const owner = await Owner.findOne({ email });
    if (!owner) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const isMatch = await owner.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const token = jwt.sign(
      { 
        id: owner._id,
        email: owner.email,
        role: owner.role,
        restaurant: owner.restaurantName
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: owner._id,
        email: owner.email,
        name: owner.name,
        restaurant: owner.restaurantName,
        role: owner.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Owner Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, restaurantName, phone, address } = req.body;
    
    // Check if owner already exists
    const existingOwner = await Owner.findOne({ email });
    if (existingOwner) {
      return res.status(400).json({ 
        success: false, 
        message: 'Owner already exists' 
      });
    }
    
    const owner = new Owner({
      email,
      password,
      name,
      restaurantName,
      phone,
      address
    });
    
    await owner.save();
    
    const token = jwt.sign(
      { 
        id: owner._id,
        email: owner.email,
        role: owner.role,
        restaurant: owner.restaurantName
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: owner._id,
        email: owner.email,
        name: owner.name,
        restaurant: owner.restaurantName,
        role: owner.role
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'super-admin') {
      return res.json({
        success: true,
        user: {
          id: 'super-admin-001',
          email: 'admin@bitebox.com',
          name: 'System Administrator',
          role: 'super-admin'
        }
      });
    }
    
    const owner = await Owner.findById(decoded.id).select('-password');
    if (!owner) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user: owner
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

module.exports = router;