import express from 'express';
import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- 1. OWNER AUTHENTICATION ---

router.post('/register', async (req, res) => {
    const { username, email, password, restaurantName, chefPassword, waiterPassword } = req.body;

    try {
        // Check if user exists
        const userExists = await Owner.findOne({ 
            $or: [{ username }, { email }] 
        });

        if (userExists) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        // 🗓️ FIX 1: AUTO-CALCULATE TRIAL END DATE (60 Days from now)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 60);

        // 🛡️ FIX 2: HANDLE MISSING EMAIL
        // If frontend doesn't send email, generate a fake one: username@bitebox.com
        const finalEmail = email || `${username.replace(/\s+/g, '').toLowerCase()}@bitebox.com`;

        const owner = await Owner.create({
            username,
            email: finalEmail,       // ✅ Satisfies "email required"
            password,
            restaurantName,
            trialEndsAt: trialEndDate, // ✅ Satisfies "trialEndsAt required"
            chefPassword: chefPassword || "bitebox18", 
            waiterPassword: waiterPassword || "bitebox18"
        });

        if (owner) {
            res.status(201).json({
                _id: owner._id,
                username: owner.username,
                restaurantName: owner.restaurantName,
                token: generateToken(owner._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// ... (Keep the rest of your routes: login, verify-role, profile, restaurants) ...
// The rest of the file does not need changes.

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const owner = await Owner.findOne({ username });
        if (owner && (await owner.matchPassword(password))) {
            res.json({
                _id: owner._id,
                username: owner.username,
                restaurantName: owner.restaurantName,
                token: generateToken(owner._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/verify-role', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const owner = await Owner.findOne({ username });
        if (!owner) return res.status(404).json({ success: false, message: "Restaurant not found" });

        let isMatch = false;
        if (role === 'chef') isMatch = owner.chefPassword === password;
        else if (role === 'waiter') isMatch = owner.waiterPassword === password;

        if (isMatch) {
            res.json({ success: true, restaurantId: owner._id, restaurantName: owner.restaurantName });
        } else {
            res.status(401).json({ success: false, message: `Invalid ${role} password` });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/profile', protect, async (req, res) => {
    try {
        const owner = await Owner.findById(req.user._id).select('-password');
        if (owner) res.json(owner);
        else res.status(404).json({ message: 'Owner not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/restaurants', async (req, res) => {
    try {
        const owners = await Owner.find({}).select('-password');
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;