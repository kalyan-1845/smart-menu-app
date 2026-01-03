import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js';

const router = express.Router();

// --- 🛡️ MIDDLEWARE (Protects Admin & Chef Routes) ---
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'fallback_secret';
            const decoded = jwt.verify(token, secret);
            
            req.user = await Owner.findById(decoded.id).select('_id username').lean(); 
            if (!req.user) return res.status(401).json({ message: 'User session expired' });
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
    } else {
        return res.status(401).json({ message: 'No authorization token' });
    }
};

// ============================================================
// 🌐 1. GET MENU (Heartbeat Sync for Customers & Admin)
// ============================================================
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 

    if (!restaurantId) return res.status(400).json({ message: "ID required" });

    try {
        let ownerObjectId;

        // CASE 1: Valid MongoDB ID
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } 
        // CASE 2: Username/Slug (e.g. "srinivas")
        else {
            const owner = await Owner.findOne({ 
                $or: [
                    { username: { $regex: new RegExp("^" + restaurantId + "$", "i") } },      
                    { restaurantName: { $regex: new RegExp("^" + restaurantId + "$", "i") } } 
                ]
            }).select('_id').lean();

            if (!owner) return res.json([]); 
            ownerObjectId = owner._id;
        }

        // Fetch Dishes: Available items first, then by rating
        const dishes = await Dish.find({ restaurantId: ownerObjectId })
            .sort({ isAvailable: -1, category: 1, name: 1 })
            .lean();
            
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// ============================================================
// 🏗️ 2. ADMIN & CHEF TOOLS (Add, Update, Delete)
// ============================================================

// ADD DISH (Handles Bulk & Single)
router.post('/', protect, async (req, res) => {
    try {
        const newDish = new Dish({
            ...req.body,
            restaurantId: req.user._id // 🛡️ Security: Always use ID from Token
        });
        const savedDish = await newDish.save();
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: "Validation error" });
    }
});

// UPDATE DISH (Used by Admin for Price/Image AND Chef for Stock)
router.put('/:id', protect, async (req, res) => {
    try {
        const updated = await Dish.findOneAndUpdate(
            { _id: req.params.id, restaurantId: req.user._id },
            { $set: req.body }, // 🎯 Atomic update
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
        if (!deleted) return res.status(404).json({ message: "Unauthorized" });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Delete error' });
    }
});

// ============================================================
// ⭐ 3. RATE DISH (Incremental Math)
// ============================================================
router.post('/rate/:dishId', async (req, res) => {
    try {
        const { rating, comment, customerName } = req.body;
        const dish = await Dish.findById(req.params.dishId);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        const oldCount = dish.ratings?.count || 0;
        const oldAvg = dish.ratings?.average || 0;
        const newCount = oldCount + 1;
        const newAverage = ((oldAvg * oldCount) + Number(rating)) / newCount;

        dish.ratings = {
            average: parseFloat(newAverage.toFixed(1)),
            count: newCount
        };

        dish.reviews.unshift({ customerName, rating, comment, date: new Date() });
        if (dish.reviews.length > 50) dish.reviews = dish.reviews.slice(0, 50);

        await dish.save();
        res.json({ success: true, average: dish.ratings.average });
    } catch (error) {
        res.status(500).json({ message: "Review failed" });
    }
});

export default router;