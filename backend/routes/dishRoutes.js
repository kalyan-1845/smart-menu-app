import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- 🛡️ MIDDLEWARE (To protect Add/Delete routes) ---
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
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

// --- 1. GET MENU (Public) ---
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required." });

    try {
        let ownerObjectId;

        // Check if restaurantId is a valid MongoDB ID (24 chars)
        if (mongoose.Types.ObjectId.isValid(restaurantId) && restaurantId.length === 24) {
            ownerObjectId = restaurantId;
        } else {
            // If it's a username (e.g., "EpicJamk"), find the ID
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            }).select('_id');

            if (!owner) return res.json([]); // Return empty menu if owner not found
            ownerObjectId = owner._id;
        }

        // Fetch dishes for this specific owner
        const dishes = await Dish.find({ owner: ownerObjectId });
        res.json(dishes);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 2. ADD DISH (Protected) ---
router.post('/', protect, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;
        
        // 🛑 CRITICAL FIX: Explicitly use req.user._id
        const newDish = new Dish({
            name, 
            price, 
            category, 
            description, 
            image,
            owner: req.user._id // This links the dish to the dashboard
        });
        
        const savedDish = await newDish.save();
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- 3. DELETE DISH ---
router.delete('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ message: "Dish not found" });
        
        // Ensure only the owner can delete their own dish
        if(dish.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        await Dish.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// ==========================================
// 🩺 DEBUG X-RAY ROUTE (Delete this later)
// ==========================================
router.get('/debug/xray', async (req, res) => {
    try {
        // 1. Get all Owners (ID and Username)
        const owners = await Owner.find({}, 'username _id');
        
        // 2. Get all Dishes (Name and Owner ID)
        const dishes = await Dish.find({}, 'name owner');

        res.json({
            message: "--- X-RAY REPORT ---",
            owners: owners,
            dishes: dishes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;