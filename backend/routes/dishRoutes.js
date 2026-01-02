import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- 🛡️ AUTH MIDDLEWARE ---
const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = await Owner.findById(decoded.id).select('-password');
        next();
    } catch (error) { res.status(401).json({ message: 'Unauthorized' }); }
};

// --- 🚦 THE FIX: GET DISHES (Matches Seeded Items to Menu) ---
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    if (!restaurantId) return res.status(400).json({ message: "ID required" });

    try {
        let targetObjectId;

        // 1. Check if the incoming ID is a valid Mongo ID
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            targetObjectId = restaurantId;
        } else {
            // 2. If it's a username (like 'admin' from your seed script), find its ID
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            });
            if (!owner) return res.status(404).json({ message: "Restaurant not found" });
            targetObjectId = owner._id;
        }

        // 3. Find dishes linked to that ID
        const dishes = await Dish.find({ owner: targetObjectId }); 
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- ➕ ADD ITEM (Admin Panel) ---
router.post('/', protect, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;
        const newDish = new Dish({
            name, price, category, description, image,
            owner: req.user.id 
        });
        const savedDish = await newDish.save();
        res.status(201).json(savedDish);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// --- 🔄 UPDATE ITEM (Chef/Stock Toggle) ---
router.put('/:id', async (req, res) => {
    try {
        const dish = await Dish.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(dish);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// --- 🗑️ DELETE ITEM ---
router.delete('/:id', protect, async (req, res) => {
    try {
        await Dish.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ message: 'Error' }); }
});

export default router;