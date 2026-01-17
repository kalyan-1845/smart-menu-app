import Owner from '../models/Owner.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// --- 1. REGISTER (For you to create owners) ---
export const registerOwner = async (req, res) => {
    try {
        const { username, password, restaurantName, phoneNumber } = req.body;
        
        // Check if username exists
        const existing = await Owner.findOne({ username });
        if (existing) return res.status(400).json({ message: "Username taken" });

        const owner = new Owner({
            username,
            password, // Password is encrypted via pre-save hook in Model
            restaurantName,
            phoneNumber
        });

        await owner.save();
        res.status(201).json({ success: true, message: "Restaurant Created" });
    } catch (error) {
        res.status(500).json({ message: "Registration Failed" });
    }
};

// --- 2. LOGIN (For Owners to access Dashboard) ---
export const loginOwner = async (req, res) => {
    try {
        const { username, password } = req.body;
        const owner = await Owner.findOne({ username });

        if (owner && (await owner.matchPassword(password))) {
            const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET || 'secret', {
                expiresIn: '30d',
            });

            res.json({
                _id: owner._id,
                username: owner.username,
                restaurantName: owner.restaurantName,
                isPro: owner.isPro,
                token
            });
        } else {
            res.status(401).json({ message: "Invalid Credentials" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// --- 3. ⚡️ RESOLVE ID (The Critical Function for QR Codes) ---
// This is what Cart.jsx calls when the page loads
export const getOwnerIdByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const owner = await Owner.findOne({ username }).select('_id restaurantName isPro settings');

        if (owner) {
            res.json({ 
                id: owner._id, 
                name: owner.restaurantName,
                isPro: owner.isPro,
                settings: owner.settings
            });
        } else {
            res.status(404).json({ message: "Restaurant Not Found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// --- 4. GET DETAILS (For Menu Header) ---
export const getRestaurantDetails = async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id).select('-password');
        if(owner) res.json(owner);
        else res.status(404).json({message: "Not found"});
    } catch (e) {
        res.status(500).json({message: "Error"});
    }
};

// --- 5. SAVE SUBSCRIPTION (For Notifications) ---
export const saveSubscription = async (req, res) => {
    // Logic to save WebPush subscription (optional)
    res.json({ success: true });
};