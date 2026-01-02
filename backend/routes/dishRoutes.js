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
 * 1. GET DISHES (Public)
 */
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required." });

    try {
        let ownerObjectId;
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } else {
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            });
            if (!owner) return res.status(404).json({ message: "Restaurant not found." });
            ownerObjectId = owner._id;
        }

        const dishes = await Dish.find({ owner: ownerObjectId }); 
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * 2. ADD DISH (Protected)
 * ✅ FIX: Broadcasts to BOTH ID and Username (kalyanresto1)
 */
router.post('/', protect, async (req, res) => {
    try {
        const { name, price, category, description, image } = req.body;
        
        const newDish = new Dish({
            name, price, category, description, image,
            owner: req.user.id 
        });
        
        const savedDish = await newDish.save();

        if (req.io) {
            // 1. Send to Owner ID (Admin Dashboard)
            req.io.to(req.user.id.toString()).emit('menu-updated', savedDish);
            
            // 2. Send to Username (Customer Menu: kalyanresto1)
            if (req.user.username) {
                req.io.to(req.user.username).emit('menu-updated', savedDish);
            }
        }

        res.status(201).json(savedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 3. UPDATE DISH (Protected)
 * ✅ FIX: Broadcasts to BOTH
 */
router.put('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if(!dish) return res.status(404).json({ message: "Dish not found" });
        if(dish.owner.toString() !== req.user.id) return res.status(401).json({ message: "Not authorized" });

        const updatedDish = await Dish.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, 
            { new: true }
        );

        if (req.io) {
            req.io.to(updatedDish.owner.toString()).emit('menu-updated', updatedDish);
            
            if (req.user.username) {
                req.io.to(req.user.username).emit('menu-updated', updatedDish);
            }
        }

        res.json(updatedDish);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 4. DELETE DISH (Protected)
 * ✅ FIX: Broadcasts to BOTH
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ message: "Dish not found" });
        if(dish.owner.toString() !== req.user.id) return res.status(401).json({ message: "Not authorized" });

        const ownerId = dish.owner;
        await Dish.findByIdAndDelete(req.params.id);

        if (req.io) {
            req.io.to(ownerId.toString()).emit('menu-deleted', req.params.id);
            if (req.user.username) {
                req.io.to(req.user.username).emit('menu-deleted', req.params.id);
            }
        }

        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;