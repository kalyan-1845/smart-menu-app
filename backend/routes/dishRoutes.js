import express from 'express';
import mongoose from 'mongoose';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 
import { protect, checkSubscription } from '../middleware/authMiddleware.js'; // 🟢 Centralized Auth

const router = express.Router();

/**
 * 1. ADD NEW DISH (Protected)
 * POST /api/dishes
 * 💰 'checkSubscription' will block this if 6 months are over and unpaid.
 */
router.post('/', protect, checkSubscription, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;

        // Validation
        if (!name || !price || !category) {
            return res.status(400).json({ message: "Name, price, and category are required." });
        }

        const newDish = new Dish({
            name, 
            price, 
            category, 
            description, 
            image,
            owner: req.user.id // Taken from the secure token
        });

        const savedDish = await newDish.save();
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 2. GET DISHES (Public)
 * GET /api/dishes?restaurantId=...
 * 🎯 Logic: Smartly detects if 'restaurantId' is a Username OR a Database ID.
 */
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    
    if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID or Username is required." });
    }

    try {
        let ownerObjectId;

        // A. Is it a MongoDB ID? (24 chars)
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } else {
            // B. No, it's a Username (e.g. 'kalyanresto') -> Look it up!
            const owner = await Owner.findOne({ username: restaurantId });

            if (!owner) {
                return res.status(404).json({ message: "Restaurant not found." });
            }
            ownerObjectId = owner._id;
        }

        // Fetch dishes specifically for this owner
        const dishes = await Dish.find({ owner: ownerObjectId }); 
        res.json(dishes);

    } catch (error) {
        res.status(500).json({ message: `Failed to fetch dishes: ${error.message}` });
    }
});

/**
 * 3. DELETE DISH (Protected)
 * DELETE /api/dishes/:id
 */
router.delete('/:id', protect, checkSubscription, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }

        // Security Check: Only the creator can delete it
        if (dish.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this dish' });
        }

        await Dish.findByIdAndDelete(req.params.id);
        res.json({ message: 'Dish removed successfully' });
    } catch (error) {
        console.error("Deletion error:", error);
        res.status(500).json({ message: 'Server error during deletion.' });
    }
});

export default router;