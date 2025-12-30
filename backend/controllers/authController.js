const Owner = require('../models/Owner');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
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
        role: owner.role,
        phone: owner.phone,
        address: owner.address
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const superLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Hardcoded super admin credentials for development
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
    
    // Check for super admin in database
    const superAdmin = await Owner.findOne({ 
      email, 
      role: 'super-admin' 
    });
    
    if (!superAdmin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid super admin credentials' 
      });
    }
    
    const isMatch = await superAdmin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const token = jwt.sign(
      { 
        id: superAdmin._id,
        email: superAdmin.email,
        role: superAdmin.role,
        name: superAdmin.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: superAdmin._id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role
      }
    });
    
  } catch (error) {
    console.error('Super login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, name, restaurantName, phone, address } = req.body;
    
    const existingOwner = await Owner.findOne({ email });
    if (existingOwner) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
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
        role: owner.role,
        phone: owner.phone,
        address: owner.address
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const owner = await Owner.findById(req.user.id).select('-password');
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
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow role changes through profile update
    if (updates.role) {
      delete updates.role;
    }
    
    const owner = await Owner.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
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
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

module.exports = {
  login,
  superLogin,
  register,
  getProfile,
  updateProfile
};