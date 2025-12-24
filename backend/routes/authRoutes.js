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
 * Logic: Sets up a 60-day trial.
 */
router.post('/register', async (req, res) => {
    const { restaurantName, username, email, password } = req.body;

    try {
        const userExists = await Owner.findOne({ $or: [{ username }, { email }] });
        if (userExists) {
            return res.status(400).json({ 
                message: 'Username or Email already registered.' 
            });
        }

        // TRIAL SETUP: Today + 60 days
        const today = new Date();
        const trialEndDate = new Date(today);
        trialEndDate.setDate(trialEndDate.getDate() + 60);

        const user = await Owner.create({ 
            restaurantName,
            username, 
            email,
            password,
            trialEndsAt: trialEndDate,
            isPro: false
        });
        
        res.status(201).json({
            _id: user._id,
            username: user.username,
            restaurantName: user.restaurantName,
            trialEndsAt: user.trialEndsAt,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 2. OWNER LOGIN
 * Logic: Matches Restaurant ID (Username) and Password.
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Accept either email or username as the identifier
        const user = await Owner.findOne({ 
            $or: [{ email: username }, { username: username }] 
        });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                restaurantName: user.restaurantName,
                trialEndsAt: user.trialEndsAt,
                isPro: user.isPro,
                token: generateToken(user._id) 
            });
        } else {
            res.status(401).json({ message: 'Invalid ID or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * 3. GET RESTAURANT PROFILE
 * Used for headers and trial countdowns.
 */
router.get('/restaurant/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let owner;

        if (mongoose.Types.ObjectId.isValid(id)) {
            owner = await Owner.findById(id).select('-password');
        } else {
            owner = await Owner.findOne({ username: id }).select('-password');
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
        const owners = await Owner.find().select('_id username restaurantName trialEndsAt isPro');
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- SUPER ADMIN MANAGEMENT ROUTES ---

/**
 * 5. ADMIN: DELETE CLIENT & PURGE DATA
 * Used by Srinivas to remove restaurants and their content.
 */
router.delete('/admin/delete-owner/:id', async (req, res) => {
    try {
        const ownerId = req.params.id;
        const owner = await Owner.findById(ownerId);
        if (!owner) return res.status(404).json({ message: "Owner not found" });

        await Owner.findByIdAndDelete(ownerId);

        // PURGE: Remove dishes and orders linked to this restaurant
        await Dish.deleteMany({ owner: ownerId }); 
        await Order.deleteMany({ owner: ownerId });

        res.json({ message: `Access revoked for ${owner.username}. Data purged.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;