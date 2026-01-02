import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 

const router = express.Router();

// ==========================================
// 🛡️ MIDDLEWARE
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
 * 1. GET DISHES (Public - Smart Search)
 * Resolves Username or ObjectId and finds by "owner"
 */
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    
    if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID is required." });
    }

    try {
        let ownerObjectId;

        // Check if input is a valid MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } else {
            // Search for owner if input is a username string
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            });

            if (!owner) {
                return res.status(404).json({ message: "Restaurant not found." });
            }
            ownerObjectId = owner._id;
        }

        // ✅ IMPORTANT: Uses "owner" to match the Dish.js Model
        const dishes = await Dish.find({ owner: ownerObjectId }); 
        res.json(dishes);

    } catch (error) {
        console.error("🔥 [API] Error:", error.message);
        res.status(500).json({ message: error.message });
    }
});

/**
 * 2. ADD DISH (Protected)
 * Saves using req.user.id to ensure the dish is linked to the logged-in owner
 */
router.post('/', protect, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;
        
        // ✅ Uses "owner" to match the schema field
        const newDish = new Dish({
            name, 
            price, 
            category, 
            description, 
            image,
            owner: req.user.id 
        });
        
        const savedDish = await newDish.save();

        // ⚡ Notify all clients in the restaurant room
        if (req.io) {
            req.io.to(req.user.id.toString()).emit('menu-updated');
        }

        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 3. UPDATE DISH / STOCK (Real-time sync)
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
 * 4. DELETE DISH
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        const ownerId = dish.owner;
        await Dish.findByIdAndDelete(req.params.id);

        if (req.io && ownerId) {
            req.io.to(ownerId.toString()).emit('menu-updated');
        }

        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;