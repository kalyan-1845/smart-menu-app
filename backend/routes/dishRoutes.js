import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// --- MODELS ---
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 

const router = express.Router();

// ==========================================
// ☁️ CLOUDINARY CONFIG
// ==========================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'menu-items',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
});
const upload = multer({ storage });

// ==========================================
// 🛡️ MIDDLEWARE
// ==========================================
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            req.user = await Owner.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ message: 'User not found' });
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Token failed' });
        }
    } else {
        next(); 
    }
};

// ==========================================
// 🚦 ROUTES
// ==========================================

/**
 * 1. GET DISHES (Public - Smart Search)
 * ✅ FIX: Added Logs & Trim to debug why dishes aren't showing
 */
router.get('/', async (req, res) => {
    let { restaurantId, category } = req.query; 
    
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required." });

    // 🟢 DEBUG LOGS (Check Render Logs to see these!)
    console.log(`🔍 Searching Menu for: "${restaurantId}"`);

    try {
        restaurantId = restaurantId.trim(); // Remove accidental spaces
        let ownerObjectId = restaurantId;

        // 🛑 STRICT CHECK: Only treat as ID if it is a 24-character Hex String
        const isValidHexId = /^[0-9a-fA-F]{24}$/.test(restaurantId);

        if (!isValidHexId) {
            console.log("👉 Input is a Username. Looking up owner...");
            
            // Search for username (Case Insensitive)
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            });

            if (!owner) {
                console.log("❌ Owner NOT FOUND for username:", restaurantId);
                return res.json([]); // Return empty to prevent crash
            }

            console.log(`✅ Owner Found! ID: ${owner._id}`);
            ownerObjectId = owner._id;
        } else {
            console.log("👉 Input is a valid ID.");
        }

        // Build Query
        let query = { owner: ownerObjectId };
        if (category && category !== "All") query.category = category;

        const dishes = await Dish.find(query); 
        console.log(`📦 Found ${dishes.length} dishes.`);
        
        res.json(dishes);

    } catch (error) {
        console.error("🔥 [API] Error:", error.message);
        res.status(500).json({ message: error.message });
    }
});

/**
 * 2. ADD DISH (Protected)
 */
router.post('/add', protect, upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, description } = req.body;
        const image = req.file ? req.file.path : (req.body.image || "");
        
        // Priority: Token ID -> Form ID
        let ownerId = req.user ? req.user._id : req.body.owner;

        if (!ownerId) return res.status(400).json({ message: "You must be logged in." });

        const newDish = new Dish({
            name, price, category, description, image, owner: ownerId
        });
        
        const savedDish = await newDish.save();

        if (req.io) {
            req.io.to(ownerId.toString()).emit('new-dish-added', savedDish);
            req.io.to(ownerId.toString()).emit('menu-updated');
        }

        res.status(201).json(savedDish);
    } catch (error) {
        console.error("Add Dish Error:", error);
        res.status(400).json({ message: "Failed to add dish" });
    }
});

// Update Dish
router.put('/:id', async (req, res) => {
    try {
        const dish = await Dish.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (req.io && dish) req.io.to(dish.owner.toString()).emit('menu-updated');
        res.json(dish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Toggle Availability
router.put('/:id/toggle', async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ message: "Dish not found" });
        dish.isAvailable = !dish.isAvailable;
        await dish.save();
        if (req.io) req.io.to(dish.owner.toString()).emit('menu-updated');
        res.json(dish);
    } catch (error) {
        res.status(500).json({ message: "Toggle failed" });
    }
});

// Delete Dish
router.delete('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (dish) {
            const ownerId = dish.owner;
            await Dish.findByIdAndDelete(req.params.id);
            if (req.io) req.io.to(ownerId.toString()).emit('menu-updated');
        }
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;