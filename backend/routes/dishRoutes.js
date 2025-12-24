import express from 'express';
import mongoose from 'mongoose';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 
import { protect, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 1. ADD NEW DISH (Protected)
 * POST /api/dishes
 */
router.post('/', protect, checkSubscription, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ message: "Name, price, and category are required." });
        }

        const newDish = new Dish({
            name, 
            price, 
            category, 
            description, 
            image,
            owner: req.user.id // Taken from the protect middleware
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
 * Detects if 'restaurantId' is a Username OR a Database ID.
 */
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    
    if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID or Username is required." });
    }

    try {
        let ownerObjectId;

        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } else {
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

/**
 * 3. UPDATE DISH / TOGGLE AVAILABILITY (Protected)
 * PUT /api/dishes/:id
 * 🎯 Used by Chef to mark items as "Sold Out" or by Admin to edit price.
 */
router.put('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);

        if (!dish) return res.status(404).json({ message: "Dish not found" });

        // Security: Ensure the user owns this dish
        if (dish.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const updatedDish = await Dish.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, // Updates only fields sent (e.g. { isAvailable: false })
            { new: true }
        );

        res.json(updatedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 4. DELETE DISH (Protected)
 * DELETE /api/dishes/:id
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        
        if (!dish) return res.status(404).json({ message: 'Dish not found' });

        if (dish.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Dish.findByIdAndDelete(req.params.id);
        res.json({ message: 'Dish removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during deletion.' });
    }
});

export default router;