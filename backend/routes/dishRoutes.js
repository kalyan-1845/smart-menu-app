import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js';

const router = express.Router();

// --- 🛡️ MIDDLEWARE (Protects Admin Routes) ---
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // Use the secret from .env, or a fallback if testing
            const secret = process.env.JWT_SECRET || 'fallback_secret';
            const decoded = jwt.verify(token, secret);
            
            // Lean selection: Only get what is needed
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
// 🌐 1. GET MENU (Smart Search: ID or Username)
// ============================================================
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    console.log(`🔍 Searching for menu: "${restaurantId}"`);

    if (!restaurantId) return res.status(400).json({ message: "ID required" });

    try {
        let ownerObjectId;

        // CASE 1: It is a MongoDB ID
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } 
        // CASE 2: It is a Username or Restaurant Name
        else {
            const owner = await Owner.findOne({ 
                $or: [
                    { username: { $regex: new RegExp("^" + restaurantId + "$", "i") } },      
                    { restaurantName: { $regex: new RegExp("^" + restaurantId + "$", "i") } } 
                ]
            }).select('_id').lean();

            if (!owner) {
                console.log(`❌ Owner NOT FOUND: ${restaurantId}`);
                return res.json([]); 
            } 
            ownerObjectId = owner._id;
        }

        // Fetch Dishes
        const dishes = await Dish.find({ restaurantId: ownerObjectId })
            .sort({ isAvailable: -1, "ratings.average": -1 })
            .lean();
            
        res.json(dishes);

    } catch (error) {
        console.error("❌ Menu Load Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// ============================================================
// ⭐ 2. RATE DISH (Incremental Math)
// ============================================================
router.post('/rate/:dishId', async (req, res) => {
    try {
        const { rating, comment, customerName } = req.body;
        const { dishId } = req.params;

        const dish = await Dish.findById(dishId);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        // Atomic Average Calculation
        const oldCount = dish.ratings?.count || 0;
        const oldAvg = dish.ratings?.average || 0;
        const newCount = oldCount + 1;
        const newAverage = ((oldAvg * oldCount) + Number(rating)) / newCount;

        dish.ratings = {
            average: parseFloat(newAverage.toFixed(1)),
            count: newCount
        };

        // Keep only last 50 reviews
        dish.reviews.unshift({ customerName, rating, comment });
        if (dish.reviews.length > 50) dish.reviews = dish.reviews.slice(0, 50);

        await dish.save();
        res.json({ success: true, average: dish.ratings.average });
    } catch (error) {
        res.status(500).json({ message: "Review failed" });
    }
});

// ============================================================
// 🏗️ 3. ADMIN TOOLS (Add, Update, Delete)
// ============================================================

router.post('/', protect, async (req, res) => {
    try {
        const newDish = new Dish({
            ...req.body,
            restaurantId: req.user._id // Bind to logged-in owner
        });
        const savedDish = await newDish.save();
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: "Validation error" });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const updated = await Dish.findOneAndUpdate(
            { _id: req.params.id, restaurantId: req.user._id },
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Not Found or Unauthorized" });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Update failed" });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const deleted = await Dish.findOneAndDelete({ 
            _id: req.params.id, 
            restaurantId: req.user._id 
        });
        if (!deleted) return res.status(404).json({ message: "Not Found or Unauthorized" });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Delete error' });
    }
});

export default router;