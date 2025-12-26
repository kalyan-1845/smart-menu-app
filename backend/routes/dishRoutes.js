import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- MIDDLEWARE TO CHECK LOGIN ---
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
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// ==========================================
// 1. GET DISHES (Public - Smart Lookup)
// ==========================================
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    
    if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID required." });
    }

    try {
        let ownerObjectId;

        // CASE A: Input is a valid MongoDB ID
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } 
        // CASE B: Input is a Username (e.g., "kalyanresto1")
        else {
            const owner = await Owner.findOne({ username: restaurantId });
            if (!owner) {
                return res.status(404).json({ message: "Restaurant not found." });
            }
            ownerObjectId = owner._id;
        }

        const dishes = await Dish.find({ owner: ownerObjectId }); 
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: `Failed to fetch: ${error.message}` });
    }
});

// ==========================================
// 2. ADD DISH (Protected - FIXED LOGIC)
// ==========================================
router.post('/', protect, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ message: "Name, price, and category are required." });
        }

        // ✅ THE FIX: Always use req.user.id (Actual Logged-In User)
        // This ignores any stale/wrong IDs sent from the frontend
        const newDish = new Dish({
            name, 
            price, 
            category, 
            description, 
            image,
            owner: req.user.id, 
            isAvailable: true
        });

        const savedDish = await newDish.save();
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ==========================================
// 3. DELETE DISH (Protected)
// ==========================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ message: 'Dish not found' });

        // Ensure only the owner can delete their own dish
        if (dish.owner.toString() !== req.user.id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Dish.findByIdAndDelete(req.params.id);
        res.json({ message: 'Dish removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during deletion.' });
    }
});

// ==========================================
// 4. UPDATE DISH (Protected)
// ==========================================
router.put('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        if (dish.owner.toString() !== req.user.id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const updatedDish = await Dish.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(updatedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;