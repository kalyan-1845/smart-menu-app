import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js';

const router = express.Router();

// --- 🛡️ MIDDLEWARE (Optimized Gatekeeper) ---
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // Uses fallback secret if environment variable is missing
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            
            // Lean selection: Only get what is needed to verify ownership
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
// 🌐 1. GET MENU (Public - High Speed)
// ============================================================
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; // Could be "kalyanresto1" or 24-char ID
    if (!restaurantId) return res.status(400).json({ message: "ID required" });

    try {
        let ownerObjectId;

        // 🧠 SMART LOOKUP: Resolve Username or ObjectID
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } else {
            // Case-insensitive search for usernames like "kalyanresto1"
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            }).select('_id').lean();

            if (!owner) return res.json([]); 
            ownerObjectId = owner._id;
        }

        // 🚀 PRO FETCH: Uses Lean + Sort by availability & rating
        const dishes = await Dish.find({ restaurantId: ownerObjectId })
            .sort({ isAvailable: -1, "ratings.average": -1 })
            .lean();
            
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: "Cloud Node Error" });
    }
});

// ============================================================
// ⭐ 2. RATE DISH (Public - Atomic Math Engine)
// ============================================================
router.post('/rate/:dishId', async (req, res) => {
    try {
        const { rating, comment, customerName } = req.body;
        const { dishId } = req.params;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be 1-5" });
        }

        const dish = await Dish.findById(dishId);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        // 🧠 MATH ENGINE: Update average without reading thousands of docs
        const oldCount = dish.ratings?.count || 0;
        const oldAvg = dish.ratings?.average || 0;
        const newCount = oldCount + 1;
        const newAverage = ((oldAvg * oldCount) + Number(rating)) / newCount;

        dish.ratings = {
            average: parseFloat(newAverage.toFixed(1)),
            count: newCount
        };

        // 🧹 PRUNING: Only keep last 50 reviews to keep DB fast
        dish.reviews.unshift({ customerName, rating, comment });
        if (dish.reviews.length > 50) dish.reviews = dish.reviews.slice(0, 50);

        await dish.save();
        res.json({ success: true, average: dish.ratings.average });
    } catch (error) {
        res.status(500).json({ message: "Review processing failed" });
    }
});

// ============================================================
// 🏗️ 3. ADMIN TOOLS (Add, Update, Delete)
// ============================================================

router.post('/', protect, async (req, res) => {
    try {
        const newDish = new Dish({
            ...req.body,
            restaurantId: req.user._id // Explicitly bind to authenticated owner
        });
        const savedDish = await newDish.save();
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: "Validation error" });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        // Find by ID and ensure ownership in one query
        const updated = await Dish.findOneAndUpdate(
            { _id: req.params.id, restaurantId: req.user._id },
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Access Denied/Not Found" });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Update failed" });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        // Prevent cross-restaurant deletion
        const deleted = await Dish.findOneAndDelete({ 
            _id: req.params.id, 
            restaurantId: req.user._id 
        });
        if (!deleted) return res.status(404).json({ message: "Purge failed: Forbidden" });
        res.json({ message: 'Item purged from cloud' });
    } catch (error) {
        res.status(500).json({ message: 'Server node error' });
    }
});

export default router;