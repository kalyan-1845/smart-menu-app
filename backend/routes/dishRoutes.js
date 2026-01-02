import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 

const router = express.Router();

// Middleware to verify Token
const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = await Owner.findById(decoded.id).select('-password');
        next();
    } catch (error) { res.status(401).json({ message: 'Unauthorized' }); }
};

// ---------------------------------------------------------
// 🏆 THE MENU FIX: Handles Username OR ID
// ---------------------------------------------------------
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    if (!restaurantId) return res.status(400).json({ message: "ID required" });

    try {
        let ownerId;

        // 1. Is it a Database ID? (e.g. 6954ca00...)
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerId = restaurantId;
        } else {
            // 2. Is it a Username? (e.g. "admin") -> Find the ID
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            });
            if (!owner) return res.status(404).json({ message: "Restaurant not found" });
            ownerId = owner._id;
        }

        // 3. Find the dishes for that correct ID
        const dishes = await Dish.find({ owner: ownerId }); 
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ADD ITEM (Uses Token ID to link to Owner)
router.post('/', protect, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;
        const newDish = new Dish({
            name, price, category, description, image,
            owner: req.user.id // Critical: Links item to your account
        });
        await newDish.save();
        res.status(201).json(newDish);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/:id', protect, async (req, res) => {
    await Dish.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

export default router;