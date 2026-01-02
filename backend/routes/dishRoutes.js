import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// --- MODELS ---
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 

const router = express.Router();

// ==========================================
// ☁️ CLOUDINARY CONFIG (For Images)
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
// 🚦 ROUTES
// ==========================================

/**
 * 1. GET DISHES (Public - Smart Search)
 * ✅ Handles Username (e.g. kalyanresto1) OR Database ID
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
            // It's a username (e.g., "kalyanresto1"), search for it
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            });

            if (!owner) {
                // Return empty list so page doesn't crash
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
 * 2. ADD DISH (Admin Panel)
 * ✅ FIXED: Accepts 'owner' from Body (Frontend) OR Token
 * ✅ FIXED: Handles Image Uploads correctly
 */
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        // 1. Get data from Body
        const { name, price, category, description, owner } = req.body;
        
        // 2. Handle Image (Uploaded File OR URL string)
        const image = req.file ? req.file.path : (req.body.image || "");

        // 🛑 VALIDATION: Ensure we have an Owner ID
        if (!owner) {
            return res.status(400).json({ message: "Owner ID is missing. Please re-login." });
        }

        const newDish = new Dish({
            name, 
            price, 
            category, 
            description, 
            image,
            owner: owner // Uses the ID sent by your Admin Panel
        });
        
        const savedDish = await newDish.save();

        // ⚡ SOCKET TRIGGER (Instant Update)
        if (req.io) {
            req.io.to(owner.toString()).emit('new-dish-added', savedDish);
            req.io.to(owner.toString()).emit('menu-updated');
        }

        res.status(201).json(savedDish);
    } catch (error) {
        console.error("Add Dish Error:", error);
        res.status(400).json({ message: "Failed to add dish" });
    }
});

// Alias for generic post root (compatibility)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, description, owner } = req.body;
        const image = req.file ? req.file.path : (req.body.image || "");
        
        if (!owner) return res.status(400).json({ message: "Owner ID required" });

        const newDish = new Dish({
            name, price, category, description, image, owner
        });
        const savedDish = await newDish.save();

        if (req.io) req.io.to(owner.toString()).emit('menu-updated');
        
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 3. UPDATE DISH
 */
router.put('/:id', async (req, res) => {
    try {
        const dish = await Dish.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, 
            { new: true }
        );

        if (req.io && dish) {
            req.io.to(dish.owner.toString()).emit('menu-updated');
        }
        res.json(dish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 4. TOGGLE AVAILABILITY
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
 * 5. DELETE DISH
 */
router.delete('/:id', async (req, res) => {
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