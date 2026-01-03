import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 
import mongoose from 'mongoose';

// ============================================================
// 1. PUBLIC: FETCH MENU (Smart Sync Integration)
// ============================================================
export const getDishes = async (req, res) => {
    const { restaurantId } = req.query; // Could be "kalyanresto1" or "65f8a..."

    try {
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });

        let queryId = restaurantId;

        // 🕵️ SMART LOOKUP: If restaurantId is NOT a valid ObjectId, it's a username.
        // We must find the real _id before querying the Dishes collection.
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            const owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            }).select('_id').lean();
            
            if (!owner) return res.status(404).json({ message: "Restaurant not found" });
            queryId = owner._id;
        }

        // 🚀 PRO OPTIMIZATION: Uses Lean + Sort by availability & rating
        const dishes = await Dish.find({ restaurantId: queryId })
            .select('-reviews') 
            .sort({ isAvailable: -1, "ratings.average": -1 })
            .lean();

        res.status(200).json(dishes);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ message: "Sync Node Error" });
    }
};

// ============================================================
// 2. PUBLIC: SUBMIT RATING (Atomic Math Engine)
// ============================================================
export const addDishReview = async (req, res) => {
    const { dishId } = req.params;
    const { rating, comment, customerName } = req.body;

    try {
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be 1-5" });
        }

        const dish = await Dish.findById(dishId);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        // 🧠 O(1) COMPLEXITY MATH: Update average without reading thousands of docs
        const currentCount = dish.ratings?.count || 0;
        const currentAvg = dish.ratings?.average || 0;
        const newCount = currentCount + 1;
        const newAverage = ((currentAvg * currentCount) + Number(rating)) / newCount;

        dish.ratings = {
            average: parseFloat(newAverage.toFixed(1)),
            count: newCount
        };

        // 🧹 PRUNING: Keep only last 50 reviews to keep DB fast
        dish.reviews.unshift({
            customerName: customerName || "Guest",
            rating: Number(rating),
            comment: comment || "",
            createdAt: new Date()
        });
        if (dish.reviews.length > 50) dish.reviews = dish.reviews.slice(0, 50);

        await dish.save();
        res.status(200).json({ success: true, average: dish.ratings.average });
    } catch (error) {
        res.status(500).json({ message: "Rating failed" });
    }
};

// ============================================================
// 3. ADMIN: MANAGE ITEMS (Security Locked)
// ============================================================

export const createDish = async (req, res) => {
    try {
        // req.user._id comes from Auth Middleware
        const dishData = { ...req.body, restaurantId: req.user._id }; 
        const dish = await Dish.create(dishData);
        res.status(201).json(dish);
    } catch (error) {
        res.status(400).json({ message: "Item creation failed" });
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
        if (!deleted) return res.status(403).json({ message: "Delete forbidden" });
        res.status(200).json({ message: "PURGED FROM CLOUD" });
    } catch (error) {
        res.status(400).json({ message: "Delete failed" });
    }
};