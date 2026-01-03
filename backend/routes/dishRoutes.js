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
 * 1. GET DISHES (Public - SUPER SEARCH)
 * ✅ FIX: Searches Username AND Email AND Name to find the owner.
 */
const getDishesLogic = async (req, res) => {
    let searchInput = req.query.restaurantId || req.params.restaurantId;
    
    console.log(`🔎 [API] Searching menu for: "${searchInput}"`);

    if (!searchInput) {
        return res.status(400).json({ message: "Restaurant ID is required." });
    }

    // CLEANUP: Remove spaces just in case " kalyanresto1 " was sent
    searchInput = searchInput.trim();

    try {
        let ownerObjectId;

        // A. Check if it is a direct Database ID (e.g. 64f2...)
        if (mongoose.Types.ObjectId.isValid(searchInput)) {
            ownerObjectId = searchInput;
        } else {
            // B. SUPER SEARCH: Look in Username OR Email OR Name
            // This ensures we find "kalyanresto1" even if it's saved as an email or name.
            const regex = new RegExp("^" + searchInput + "$", "i"); // Case insensitive
            
            const owner = await Owner.findOne({
                $or: [
                    { username: regex },
                    { email: regex },
                    { restaurantName: regex },
                    { name: regex } 
                ]
            });

            if (!owner) {
                console.log(`❌ [API] Owner "${searchInput}" NOT found in DB.`);
                
                // 🕵️ DEBUG: Uncomment this to see what IS in your DB if you are stuck
                // const allUsers = await Owner.find({}, "username email");
                // console.log("Did you mean one of these?", allUsers);

                return res.status(404).json({ message: "Restaurant not found" });
            }
            
            console.log(`✅ [API] Found Owner: ${owner.username} (${owner._id})`);
            ownerObjectId = owner._id;
        }

        // C. Fetch Dishes
        const dishes = await Dish.find({ restaurantId: ownerObjectId }); 
        
        // If no dishes, return empty array (Frontend handles this better than 404)
        if (!dishes || dishes.length === 0) {
             console.log("⚠️ Owner found, but no dishes in menu.");
             return res.json([]); 
        }

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
 * 2. ADD DISH (Protected - Owner Only)
 */
router.post('/', protect, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;
        const newDish = new Dish({
            name, price, category, description, image,
            restaurantId: req.user.id 
        });
        const savedDish = await newDish.save();
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 3. UPDATE DISH (Public/Chef Access)
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
 * 4. DELETE DISH (Protected - Owner Only)
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
 * 5. ADD REVIEW (Public)
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