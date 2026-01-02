import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 

const router = express.Router();

// ==========================================
// 🚀 PERFORMANCE CACHE (Simple In-Memory)
// ==========================================
// In a multi-server setup (AWS/DigitalOcean), replace this Map with Redis.
// This simple Map works perfectly for single-server deployments up to ~50k concurrent users.
const menuCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // Cache lives for 10 minutes

// Helper: Clear cache for a specific restaurant
const clearRestaurantCache = (ownerId, username) => {
    if (ownerId) menuCache.delete(ownerId.toString());
    if (username) menuCache.delete(username);
};

// ==========================================
// 🛡️ MIDDLEWARE
// ==========================================
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            
            // Optimization: select only needed fields
            req.user = await Owner.findById(decoded.id).select('_id username'); 
            
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
 * 1. GET DISHES (Public & Cached)
 * 🚀 High Scale: Serves from RAM if available
 */
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required." });

    // ⚡ CHECK CACHE FIRST
    if (menuCache.has(restaurantId)) {
        const cachedData = menuCache.get(restaurantId);
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
            return res.json(cachedData.data);
        }
    }

    try {
        let ownerObjectId;

        // 🛑 Strict 24-char Hex Check
        const isValidId = mongoose.Types.ObjectId.isValid(restaurantId) && restaurantId.length === 24;

        if (isValidId) {
            ownerObjectId = restaurantId;
        } else {
            // Username lookup
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            }).lean(); // .lean() makes it faster

            if (!owner) return res.json([]); // Return empty array to prevent client crash
            ownerObjectId = owner._id;
        }

        // ✅ .lean() significantly speeds up large array fetches
        const dishes = await Dish.find({ owner: ownerObjectId }).lean(); 

        // ⚡ SAVE TO CACHE
        menuCache.set(restaurantId, {
            data: dishes,
            timestamp: Date.now()
        });

        res.json(dishes);

    } catch (error) {
        console.error("🔥 API Error:", error.message);
        res.status(500).json({ message: error.message });
    }
});

/**
 * 2. ADD DISH (Protected)
 * 🚀 Clears Cache & Broadcasts
 */
router.post('/', protect, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;
        
        const newDish = new Dish({
            name, price, category, description, image,
            owner: req.user.id 
        });
        
        const savedDish = await newDish.save();

        // ♻️ INVALIDATE CACHE (So next GET fetches fresh data)
        clearRestaurantCache(req.user.id, req.user.username);

        // ⚡ REAL-TIME BROADCAST
        if (req.io) {
            req.io.to(req.user.id.toString()).emit('menu-updated', savedDish);
            if (req.user.username) {
                req.io.to(req.user.username).emit('menu-updated', savedDish);
            }
        }

        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 3. UPDATE DISH (Protected)
 */
router.put('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if(!dish) return res.status(404).json({ message: "Dish not found" });
        if(dish.owner.toString() !== req.user.id) return res.status(401).json({ message: "Not authorized" });

        const updatedDish = await Dish.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, 
            { new: true }
        );

        // ♻️ INVALIDATE CACHE
        clearRestaurantCache(req.user.id, req.user.username);

        // ⚡ BROADCAST
        if (req.io) {
            req.io.to(updatedDish.owner.toString()).emit('menu-updated', updatedDish);
            if (req.user.username) {
                req.io.to(req.user.username).emit('menu-updated', updatedDish);
            }
        }

        res.json(updatedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 4. DELETE DISH (Protected)
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ message: "Dish not found" });
        if(dish.owner.toString() !== req.user.id) return res.status(401).json({ message: "Not authorized" });

        const ownerId = dish.owner;
        await Dish.findByIdAndDelete(req.params.id);

        // ♻️ INVALIDATE CACHE
        clearRestaurantCache(req.user.id, req.user.username);

        // ⚡ BROADCAST
        if (req.io) {
            req.io.to(ownerId.toString()).emit('menu-deleted', req.params.id);
            if (req.user.username) {
                req.io.to(req.user.username).emit('menu-deleted', req.params.id);
            }
        }

        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;