import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';   // ✅ Model exists
import Owner from '../models/Owner.js'; // ✅ Matches authRoutes

const router = express.Router();

// --- 🛡️ MIDDLEWARE (Protects Owner Routes) ---
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'fallback_secret';
            
            const decoded = jwt.verify(token, secret);
            
            // ✅ CRITICAL: Verifies user against the Owner collection
            req.user = await Owner.findById(decoded.id).select('_id username').lean(); 
            
            if (!req.user) return res.status(401).json({ message: 'Owner not found' });
            next();
        } catch (error) {
            console.error("Auth Failed:", error.message);
            return res.status(401).json({ message: 'Invalid Token' });
        }
    } else {
        return res.status(401).json({ message: 'No Token Provided' });
    }
};

// ============================================================
// 🌐 1. GET MENU (Public - Smart Lookup)
// ============================================================
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 

    if (!restaurantId) return res.status(400).json({ message: "ID required" });

    try {
        let ownerObjectId;

        // 1. Check if it's a valid MongoID
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } 
        // 2. If not, try finding it as a Username (The "Human Readable" Link)
        else {
            const owner = await Owner.findOne({ username: restaurantId.toLowerCase() }).select('_id');
            if (!owner) return res.json([]); // Return empty list if restaurant not found
            ownerObjectId = owner._id;
        }

        // Fetch dishes for the resolved Owner ID
        const dishes = await Dish.find({ restaurantId: ownerObjectId })
            .sort({ isAvailable: -1, category: 1, name: 1 })
            .lean();
            
        res.json(dishes);
    } catch (error) {
        console.error("Get Menu Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// ============================================================
// 🏗️ 2. OWNER TOOLS (Protected)
// ============================================================

// ADD DISH
router.post('/', protect, async (req, res) => {
    try {
        const newDish = new Dish({
            ...req.body,
            restaurantId: req.user._id // ✅ Securely links dish to the logged-in Owner
        });
        const savedDish = await newDish.save();
        res.status(201).json(savedDish);
    } catch (error) {
        console.error("Add Dish Error:", error);
        res.status(400).json({ message: "Validation error" });
    }
});

// UPDATE DISH (Price/Image/Stock)
router.put('/:id', protect, async (req, res) => {
    try {
        const updated = await Dish.findOneAndUpdate(
            { _id: req.params.id, restaurantId: req.user._id },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: "Dish not found" });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Update failed" });
    }
});

// DELETE DISH
router.delete('/:id', protect, async (req, res) => {
    try {
        const deleted = await Dish.findOneAndDelete({ 
            _id: req.params.id, 
            restaurantId: req.user._id 
        });
        if (!deleted) return res.status(404).json({ message: "Unauthorized or Not Found" });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Delete error' });
    }
});

export default router;