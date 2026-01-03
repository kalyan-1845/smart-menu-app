import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 
import mongoose from 'mongoose';

// ============================================================
// 1. PUBLIC: FETCH MENU (The Engine)
// ============================================================
export const getDishes = async (req, res) => {
    const { restaurantId } = req.query; 

    try {
        if (!restaurantId) return res.status(400).json({ message: "ID required" });

        let owner;
        
        // 🕵️ SMART LOOKUP: Finds Owner by ID (64f...) OR Username (kalyanresto1)
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            owner = await Owner.findById(restaurantId).select('_id settings').lean();
        } else {
            owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            }).select('_id settings').lean();
        }

        // Safety: If no owner found, return empty array (Don't crash)
        if (!owner) return res.json([]); 

        // 🛑 KILL SWITCH ENFORCEMENT (Crucial for God Mode)
        // If CEO turned off menu, this sends 503. The frontend catches this to show "Locked" screen.
        if (owner.settings && owner.settings.menuActive === false) {
            return res.status(503).json({ message: "❌ SERVICE SUSPENDED BY ADMIN" });
        }

        // 🚀 FETCH DISHES
        const dishes = await Dish.find({ restaurantId: owner._id })
            .select('-reviews') 
            .sort({ isAvailable: -1, "ratings.average": -1 }) // Stock first, Highest rated second
            .lean();

        res.status(200).json(dishes);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ message: "Sync Node Error" });
    }
};

// ============================================================
// 2. PUBLIC: SUBMIT RATING 
// ============================================================
export const addDishReview = async (req, res) => {
    const { dishId } = req.params;
    const { rating, comment, customerName } = req.body;

    try {
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "1-5 required" });

        const dish = await Dish.findById(dishId);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        // Calculate new average
        const currentCount = dish.ratings?.count || 0;
        const currentAvg = dish.ratings?.average || 0;
        const newCount = currentCount + 1;
        const newAverage = ((currentAvg * currentCount) + Number(rating)) / newCount;

        dish.ratings = { 
            average: parseFloat(newAverage.toFixed(1)), 
            count: newCount 
        };

        // Add review text
        dish.reviews.unshift({ 
            customerName: customerName || "Guest", 
            rating, 
            comment, 
            createdAt: new Date() 
        });
        
        // Keep DB light (Max 50 reviews stored)
        if (dish.reviews.length > 50) dish.reviews = dish.reviews.slice(0, 50);

        await dish.save();
        res.status(200).json({ success: true, average: dish.ratings.average });
    } catch (error) {
        res.status(500).json({ message: "Rating failed" });
    }
};

// ============================================================
// 3. ADMIN: MANAGE ITEMS (Protected)
// ============================================================
export const createDish = async (req, res) => {
    try {
        // Links dish strictly to the logged-in owner
        const dishData = { ...req.body, restaurantId: req.user._id }; 
        const dish = await Dish.create(dishData);
        res.status(201).json(dish);
    } catch (error) {
        res.status(400).json({ message: "Creation failed" });
    }
};

export const updateDish = async (req, res) => {
    try {
        const updated = await Dish.findOneAndUpdate(
            { _id: req.params.id, restaurantId: req.user._id }, 
            req.body, 
            { new: true }
        );
        if (!updated) return res.status(403).json({ message: "Unauthorized" });
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: "Update failed" });
    }
};

export const deleteDish = async (req, res) => {
    try {
        const deleted = await Dish.findOneAndDelete({ 
            _id: req.params.id, 
            restaurantId: req.user._id 
        });
        if (!deleted) return res.status(403).json({ message: "Forbidden" });
        res.status(200).json({ message: "PURGED" });
    } catch (error) {
        res.status(400).json({ message: "Delete failed" });
    }
};