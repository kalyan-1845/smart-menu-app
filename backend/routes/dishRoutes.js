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
// ☁️ CLOUDINARY CONFIG (For Image Uploads)
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
// 🛡️ MIDDLEWARE: PROTECT ROUTES
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
        return res.status(401).json({ message: 'No token' });
    }
};

// ==========================================
// 🚦 ROUTES
// ==========================================

/**
 * 1. GET DISHES (Public - Smart Search)
 * ✅ FIX: Handles both Username (from URL) and ObjectId (from Admin)
 * ✅ FIX: Uses strict 24-char check to prevent "12-char username bug"
 */
router.get('/', async (req, res) => {
    const { restaurantId, category } = req.query; 
    
    if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID is required." });
    }

    try {
        let ownerObjectId = restaurantId;

        // 🛑 STRICT CHECK: Only treat as ID if it is a 24-character Hex String
        const isValidHexId = /^[0-9a-fA-F]{24}$/.test(restaurantId);

        if (!isValidHexId) {
            // It's likely a username (e.g., "kalyanresto1"), search for it
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            });

            if (!owner) {
                // Return empty array instead of 404 to keep frontend alive
                return res.json([]); 
            }
            ownerObjectId = owner._id;
        }

        // Build Query
        let query = { owner: ownerObjectId };
        if (category && category !== "All") {
            query.category = category;
        }

        const dishes = await Dish.find(query); 
        res.json(dishes);

    } catch (error) {
        console.error("🔥 [API] Error:", error.message);
        res.status(500).json({ message: error.message });
    }
});

/**
 * 2. ADD DISH (Protected - Owner Only)
 * ✅ FIXED: Uses 'upload.single' to handle Image Files
 * ✅ FIXED: Socket trigger for instant menu updates
 */
router.post('/add', protect, upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, description } = req.body;
        
        // Use uploaded file URL or fallback string
        const image = req.file ? req.file.path : (req.body.image || "");

        const newDish = new Dish({
            name, 
            price, 
            category, 
            description, 
            image,
            owner: req.user.id 
        });
        
        const savedDish = await newDish.save();

        // ⚡ SOCKET TRIGGER
        if (req.io) {
            req.io.to(req.user.id.toString()).emit('new-dish-added', savedDish);
            req.io.to(req.user.id.toString()).emit('menu-updated');
        }

        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Alias for generic post root (compatibility)
router.post('/', protect, upload.single('image'), async (req, res) => {
    // Redirect logic to the handler above
    try {
        const { name, price, category, description } = req.body;
        const image = req.file ? req.file.path : (req.body.image || "");
        
        const newDish = new Dish({
            name, price, category, description, image,
            owner: req.user.id 
        });
        const savedDish = await newDish.save();

        if (req.io) {
            req.io.to(req.user.id.toString()).emit('menu-updated');
        }
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 3. UPDATE DISH / STOCK (Public/Chef Access)
 * ✅ FIXED: Added Socket trigger for instant toggling
 */
router.put('/:id', async (req, res) => {
    try {
        const dish = await Dish.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, 
            { new: true }
        );

        if (!dish) return res.status(404).json({ message: "Dish not found" });

        if (req.io) {
            req.io.to(dish.owner.toString()).emit('menu-updated');
        }

        res.json(dish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 4. TOGGLE AVAILABILITY (Specific Route)
 */
router.put('/:id/toggle', async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        dish.isAvailable = !dish.isAvailable;
        await dish.save();

        if (req.io) {
            req.io.to(dish.owner.toString()).emit('menu-updated');
        }

        res.json(dish);
    } catch (error) {
        res.status(500).json({ message: "Toggle failed" });
    }
});

/**
 * 5. DELETE DISH (Protected - Owner Only)
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ message: "Dish not found" });
        
        const ownerId = dish.owner;

        await Dish.findByIdAndDelete(req.params.id);

        if (req.io && ownerId) {
            req.io.to(ownerId.toString()).emit('menu-updated');
        }

        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;