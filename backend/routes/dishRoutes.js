import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 

const router = express.Router();

// ==========================================
// 🛡️ MIDDLEWARE (Internal)
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
 * 1. GET DISHES (Public - IN-MEMORY MATCH FIX)
 * ✅ FIX: Fetches owners list and matches via JavaScript to bypass DB query issues.
 */
const getDishesLogic = async (req, res) => {
    let rawInput = req.query.restaurantId || req.params.restaurantId;
    
    if (!rawInput) return res.status(400).json({ message: "Restaurant ID is required." });

    // 🧹 Clean Input
    let searchInput = rawInput.replace(/['"]+/g, '').trim().toLowerCase();
    console.log(`🔎 [API] Searching for: "${searchInput}"`);

    try {
        let owner;

        // A. Direct ID Check (Fastest)
        if (mongoose.Types.ObjectId.isValid(searchInput)) {
            owner = await Owner.findById(searchInput);
        } 

        // B. JAVASCRIPT MATCH (The Fix)
        // If ID check failed, fetch all owners and find the match manually.
        if (!owner) {
            const allOwners = await Owner.find({}, 'username restaurantName email _id settings');
            
            owner = allOwners.find(o => 
                (o.username && o.username.toLowerCase().trim() === searchInput) ||
                (o.restaurantName && o.restaurantName.toLowerCase().trim() === searchInput) ||
                (o.email && o.email.toLowerCase().trim() === searchInput)
            );
        }

        // ❌ IF STILL NOT FOUND
        if (!owner) {
            console.log(`❌ [API] FAILED to find owner: "${searchInput}"`);
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // C. SAFETY CHECK
        if (owner.settings && owner.settings.menuActive === false) {
             return res.status(503).json({ message: "Menu is currently offline." });
        }
            
        console.log(`✅ [API] Match Success: ${owner.username} (${owner._id})`);

        // D. FETCH DISHES (Hybrid Search)
        const dishes = await Dish.find({
            $or: [
                { restaurantId: owner._id },
                { owner: owner._id }
            ]
        }); 
        
        console.log(`📦 [API] Returning ${dishes.length} dishes.`);
        res.json(dishes);

    } catch (error) {
        console.error("🔥 [API] Error:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Route 1: Matches /api/dishes?restaurantId=kalyanresto1
router.get('/', getDishesLogic);

// Route 2: Matches /api/dishes/kalyanresto1
router.get('/:restaurantId', getDishesLogic);


/**
 * 2. ADD DISH (Protected)
 */
router.post('/', protect, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;
        const newDish = new Dish({
            name, price, category, description, image,
            restaurantId: req.user.id, 
            owner: req.user.id         
        });
        const savedDish = await newDish.save();
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
        res.json(dish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 4. DELETE DISH
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        await Dish.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * 5. ADD REVIEW
 */
router.post('/:dishId/review', async (req, res) => {
    const { dishId } = req.params;
    const { rating, comment, customerName } = req.body;

    try {
        const dish = await Dish.findById(dishId);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        const currentCount = dish.ratings?.count || 0;
        const currentAvg = dish.ratings?.average || 0;
        const newCount = currentCount + 1;
        const newAverage = ((currentAvg * currentCount) + Number(rating)) / newCount;

        dish.ratings = { average: parseFloat(newAverage.toFixed(1)), count: newCount };
        dish.reviews.unshift({ 
            customerName: customerName || "Guest", 
            rating, comment, 
            createdAt: new Date() 
        });

        await dish.save();
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Rating failed" });
    }
});

export default router;