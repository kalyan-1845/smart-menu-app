import express from 'express';
import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 🛠️ HELPER: Generate JWT Token
 * Used to keep users logged into their respective dashboards.
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- 0. REGISTER NEW RESTAURANT (Required for AddRestaurant.jsx) ---
/**
 * @route   POST /api/auth/register
 * @desc    Register a new restaurant owner
 * @access  Public
 */
router.post('/register', async (req, res) => {
    const { username, password, restaurantName, email, phone } = req.body;
    try {
        const userExists = await Owner.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const owner = await Owner.create({
            username,
            password,
            restaurantName,
            email,
            phone,
            isPro: true // Default to Pro for now
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
        res.status(500).json({ message: error.message });
    }
});

// --- 1. OWNER AUTHENTICATION (Restaurant Admin) ---

/**
 * @route   POST /api/auth/login
 * @desc    Login for Restaurant Owners
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const owner = await Owner.findOne({ username });
        if (owner && (await owner.matchPassword(password))) {
            res.json({
                _id: owner._id,
                username: owner.username,
                restaurantName: owner.restaurantName,
                isPro: owner.isPro, // Added isPro to response
                token: generateToken(owner._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 2. STAFF ROLE VERIFICATION (Chef & Waiter) ---

/**
 * @route   POST /api/auth/verify-role
 * @desc    Verify passwords for Chef or Waiter dashboards
 * @access  Public
 * @context This allows the Chef/Waiter to login using the restaurant username 
 * and the specific staff password set by the owner.
 */
router.post('/verify-role', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const owner = await Owner.findOne({ username });
        if (!owner) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        let isMatch = false;
        // Logic to check role-specific passwords stored in the Owner model
        if (role === 'chef') {
            isMatch = owner.chefPassword === password;
        } else if (role === 'waiter') {
            isMatch = owner.waiterPassword === password;
        }

        if (isMatch) {
            res.json({
                success: true,
                restaurantId: owner._id,
                restaurantName: owner.restaurantName
            });
        } else {
            res.status(401).json({ success: false, message: `Invalid ${role} password` });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 3. OWNER PROFILE ---

/**
 * @route   GET /api/auth/profile
 * @desc    Get logged-in owner details
 * @access  Protected
 */
router.get('/profile', protect, async (req, res) => {
    try {
        const owner = await Owner.findById(req.user._id).select('-password');
        if (owner) {
            res.json(owner);
        } else {
            res.status(404).json({ message: 'Owner not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/auth/restaurants
 * @desc    Fetch all registered restaurants (Used by Super Admin)
 * @access  Public (Can be protected if needed)
 */
router.get('/restaurants', async (req, res) => {
    try {
        const owners = await Owner.find({}).select('-password');
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 4. PUBLIC RESTAURANT INFO (The Fix for 404) ---

/**
 * @route   GET /api/auth/restaurant/:id
 * @desc    Get public info by ID or Username (Fixes Menu Link)
 * @access  Public
 */
router.get('/restaurant/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let restaurant;

        // Check if "id" is a valid Mongo Object ID (24 hex chars)
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            restaurant = await Owner.findById(id).select('-password');
        } else {
            // If not an ID, treat it as a Username (e.g., 'kalyanresto1')
            restaurant = await Owner.findOne({ username: id }).select('-password');
        }

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json(restaurant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

export default router;