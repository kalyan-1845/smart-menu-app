import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';

const router = express.Router();

// --- 1. REGISTER (Owner) ---
router.post('/register', async (req, res) => {
  try {
    const { username, password, restaurantName, email } = req.body;
    
    // Check if username exists
    const existing = await Owner.findOne({ username });
    if (existing) return res.status(400).json({ message: "Username already taken" });

    // Create Owner
    const newOwner = new Owner({
      username,
      email: email || "no-email@example.com",
      password, // Hashed in Model pre-save
      restaurantName,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Days Trial
    });

    await newOwner.save();
    res.status(201).json({ message: "Restaurant Registered Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// --- 2. LOGIN (Owner) ---
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const owner = await Owner.findOne({ username });

    if (!owner) return res.status(404).json({ message: "User not found" });

    const isMatch = await owner.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({
      token,
      _id: owner._id,
      username: owner.username,
      restaurantName: owner.restaurantName,
      trialEndsAt: owner.trialEndsAt,
      isPro: owner.isPro
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// --- 3. PUBLIC RESTAURANT INFO (For QR Menu) ---
router.get('/restaurant/:id', async (req, res) => {
  try {
    // Search by 'username' (the part in the URL) OR '_id'
    const owner = await Owner.findOne({ 
      $or: [{ username: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }]
    });

    if (!owner) return res.status(404).json({ message: "Restaurant Not Found" });

    // Return public info only
    res.json({
      _id: owner._id,
      username: owner.username,
      restaurantName: owner.restaurantName,
      upiId: "your-upi@okaxis" // Add this field to your Model if needed later
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// --- 4. STAFF LOGIN (Verify Chef/Waiter) ✅ FIX IS HERE ---
router.post('/verify-role', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const owner = await Owner.findOne({ username });

    if (!owner) return res.status(404).json({ success: false, message: "Restaurant not found" });

    let isValid = false;
    
    // Check against the passwords stored in Owner model
    // Note: These are simple strings in your model (default: "bitebox18")
    if (role === 'chef') {
        isValid = (password === owner.chefPassword); 
    } else if (role === 'waiter') {
        isValid = (password === owner.waiterPassword);
    }

    if (!isValid) return res.status(401).json({ success: false, message: "Wrong Password" });

    // Success: Return the MongoDB ID for socket rooms
    res.json({ success: true, restaurantId: owner._id });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 5. SUPER ADMIN ROUTES ---
router.get('/restaurants', async (req, res) => {
  try {
    const owners = await Owner.find({}, '-password'); // Return all except password
    res.json(owners);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete('/admin/delete-owner/:id', async (req, res) => {
  try {
    await Owner.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

router.put('/admin/extend-trial/:id', async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) return res.status(404).json({ message: "Not found" });

    // Add 30 days to current expiry or today
    const currentExpiry = new Date(owner.trialEndsAt) > new Date() ? new Date(owner.trialEndsAt) : new Date();
    owner.trialEndsAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    await owner.save();
    res.json({ message: "Extended" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

router.put('/admin/reset-password/:id', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const owner = await Owner.findById(req.params.id);
    if (!owner) return res.status(404).json({ message: "Not found" });

    owner.password = newPassword; // Will be hashed by pre-save hook
    await owner.save();
    
    res.json({ message: "Password Updated" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

export default router;