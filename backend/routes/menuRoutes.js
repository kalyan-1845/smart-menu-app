import express from 'express';
import mongoose from 'mongoose';
import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 

const router = express.Router();

// 1. GET MENU (Smart Search: Accepts ID or Username)
router.get('/', async (req, res) => {
    const { restaurantId } = req.query; 
    
    if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID is required." });
    }

    try {
        let ownerObjectId;

        // Check if it's a valid Database ID
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            ownerObjectId = restaurantId;
        } else {
            // Otherwise, search by Username (Case Insensitive)
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            });

            if (!owner) {
                return res.status(404).json({ message: "Restaurant not found." });
            }
            ownerObjectId = owner._id;
        }

        const dishes = await Dish.find({ owner: ownerObjectId }); 
        res.json(dishes);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;