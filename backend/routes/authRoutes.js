import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Owner from '../models/Owner.js'; 
import Dish from '../models/Dish.js'; 
import Order from '../models/Order.js'; 

const router = express.Router();

/**
 * UTILITY: Generate JWT Token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

/**
 * 1. REGISTER NEW OWNER
 * Logic: Checks if user exists by username OR email. Sets up 6-month trial.
 */
router.post('/register', async (req, res) => {
    const { restaurantName, username, email, password } = req.body;

    try {
        // Validation: Check if either identifier is already in use
        const userExists = await Owner.findOne({ $or: [{ username }, { email }] });
        if (userExists) {
            return res.status(400).json({ 
                message: 'Username or Email already registered. Use different details.' 
            });
        }

        // TRIAL SETUP: Today + 6 months
        const trialEndDate = new Date();
        trialEndDate.setMonth(trialEndDate.getMonth() + 6);

        const user = await Owner.create({ 
            restaurantName,
            username, 
            email,
            password,
            subscription: {
                plan: 'free_trial',
                trialEndsAt: trialEndDate, 
                isPaid: false 
            }
        });
        
        // Return JSON with token so Frontend can log in immediately
        res.status(201).json({
            _id: user._id,
            username: user.username,
            restaurantName: user.restaurantName,
            token: generateToken(user._id),
            trialEndsAt: user.subscription.trialEndsAt
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 2. OWNER LOGIN
 * Logic: Matches the "Restaurant ID" (Username) and Password from Frontend.
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Search specifically by username to match your login input label
        const user = await Owner.findOne({ username });
        
        // CRITICAL: .matchPassword() must be defined in your Owner model file
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id) 
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * 3. GET SINGLE RESTAURANT
 * Used for Menu headers and Dashboard greetings.
 */
router.get('/restaurant/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let owner;

        // Smart detect: Check if param is MongoDB ID or a Username slug
        if (mongoose.Types.ObjectId.isValid(id)) {
            owner = await Owner.findById(id).select('username restaurantName email');
        } else {
            owner = await Owner.findOne({ username: id }).select('username restaurantName email');
        }

        if (!owner) return res.status(404).json({ message: 'Restaurant not found' });
        
        res.json(owner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * 4. GET ALL RESTAURANTS (Public)
 */
router.get('/restaurants', async (req, res) => {
    try {
        const owners = await Owner.find().select('_id username restaurantName');
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- SUPER ADMIN ROUTES (FOR SRINIVAS) ---

/**
 * 5. ADMIN: VIEW ALL SaaS CLIENTS
 */
router.get('/admin/all-owners', async (req, res) => {
    try {
        const owners = await Owner.find().select('-password').sort({ createdAt: -1 }); 
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * 6. ADMIN: DELETE CLIENT & PURGE DATA
 */
router.delete('/admin/delete-owner/:id', async (req, res) => {
    try {
        const ownerId = req.params.id;
        const owner = await Owner.findById(ownerId);
        if (!owner) return res.status(404).json({ message: "Owner not found" });

        await Owner.findByIdAndDelete(ownerId);

        // CLEANUP: Wipe out associated menu items and order history
        await Dish.deleteMany({ restaurantId: ownerId }); 
        await Order.deleteMany({ restaurantId: ownerId });

        res.json({ message: `Access revoked for ${owner.username}. Data purged.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;