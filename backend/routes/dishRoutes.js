import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'; // 🟢 Required for Token
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
// 🛡️ MIDDLEWARE: PROTECT (Restored)
// ==========================================
// This extracts the User ID from the Login Token
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            req.user = await Owner.findById(decoded.id).select('-password');
            if (!req.user) {
                console.log("❌ Protect: User not found in DB");
                return res.status(401).json({ message: 'User not found' });
            }
            next();
        } catch (error) {
            console.error("❌ Protect Error:", error.message);
            return res.status(401).json({ message: 'Token failed' });
        }
    } else {
        console.log("❌ Protect: No token provided");
        // We continue without error to allow 'req.body.owner' fallback in the route, 
        // but usually, this means the user is logged out.
        next(); 
    }
};

// ==========================================
// 🚦 ROUTES
// ==========================================

/**
 * 1. GET DISHES (Public - Smart Search)
 */
router.get('/', async (req, res) => {
    const { restaurantId, category } = req.query; 
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required." });

    try {
        let ownerObjectId = restaurantId;
        const isValidHexId = /^[0-9a-fA-F]{24}$/.test(restaurantId);

        if (!isValidHexId) {
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            });
            if (!owner) return res.json([]); 
            ownerObjectId = owner._id;
        }

        let query = { owner: ownerObjectId };
        if (category && category !== "All") query.category = category;

        const dishes = await Dish.find(query); 
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * 2. ADD DISH (Protected - Admin)
 * ✅ FIX: Tries to get Owner ID from Token (req.user) FIRST.
 */
router.post('/add', protect, upload.single('image'), async (req, res) => {
    try {
        console.log("📥 Add Dish Request Received");
        
        const { name, price, category, description } = req.body;
        // Check for image in File (Multer) OR Body (URL string)
        const image = req.file ? req.file.path : (req.body.image || "");

        // 🟢 CRITICAL FIX: Determine Owner ID
        // Priority 1: From Token (req.user._id) -> Most Secure
        // Priority 2: From Form Data (req.body.owner) -> Fallback
        let ownerId = req.user ? req.user._id : req.body.owner;

        if (!ownerId) {
            console.error("❌ Add Dish Failed: Owner ID missing");
            return res.status(400).json({ message: "You must be logged in to add dishes." });
        }

        console.log(`✅ Adding Dish for Owner: ${ownerId}`);

        const newDish = new Dish({
            name, 
            price, 
            category, 
            description, 
            image,
            owner: ownerId
        });
        
        const savedDish = await newDish.save();

        if (req.io) {
            req.io.to(ownerId.toString()).emit('new-dish-added', savedDish);
            req.io.to(ownerId.toString()).emit('menu-updated');
        }

        res.status(201).json(savedDish);
    } catch (error) {
        console.error("❌ Add Dish Error:", error);
        res.status(400).json({ message: "Failed to add dish: " + error.message });
    }
});

// Alias Route (for compatibility)
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, description } = req.body;
        const image = req.file ? req.file.path : (req.body.image || "");
        let ownerId = req.user ? req.user._id : req.body.owner;

        if (!ownerId) return res.status(400).json({ message: "Owner ID required" });

        const newDish = new Dish({ name, price, category, description, image, owner: ownerId });
        const savedDish = await newDish.save();

        if (req.io) req.io.to(ownerId.toString()).emit('menu-updated');
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
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