import express from 'express';
import mongoose from 'mongoose';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 
import { protect, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 1. ADD NEW DISH (Admin Only)
 * @route   POST /api/dishes
 * @desc    Add a dish to the restaurant menu
 * @access  Protected (Owner only)
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
            owner: req.user.id // Link dish to the logged-in restaurant
        });

        const savedDish = await newDish.save();
        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 2. GET DISHES (Public / Customer Facing)
 * @route   GET /api/dishes?restaurantId=...
 * @desc    Fetch menu items. Supports both Database ID and Username URLs.
 * @access  Public
 */
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    
    if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID or Username is required." });
    }

    try {
        let ownerObjectId;

        // Detect if the request is using a DB ID or a clean Username (e.g. /kalyanresto1)
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } else {
            const owner = await Owner.findOne({ username: restaurantId });
            if (!owner) {
                return res.status(404).json({ message: "Restaurant not found." });
            }
            ownerObjectId = owner._id;
        }

        // Only fetch dishes that belong to this specific owner
        const dishes = await Dish.find({ owner: ownerObjectId }); 
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: `Failed to fetch: ${error.message}` });
    }
});

/**
 * 3. UPDATE DISH / STOCK MANAGEMENT (Chef & Admin)
 * @route   PUT /api/dishes/:id
 * @desc    Edit dish details or toggle availability (Sold Out/In Stock)
 * @access  Protected
 */
router.put('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);

        if (!dish) return res.status(404).json({ message: "Dish not found" });

        // Security: Ensure the user owns this dish before allowing changes
        if (dish.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const updatedDish = await Dish.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, // Dynamically updates fields like { isAvailable: false }
            { new: true }
        );

        res.json(updatedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 4. DELETE DISH (Admin Only)
 * @route   DELETE /api/dishes/:id
 * @desc    Permanently remove a dish from the menu
 * @access  Protected
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