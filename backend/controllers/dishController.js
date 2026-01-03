import Dish from '../models/Dish.js';
import Owner from '../models/Owner.js'; 
import mongoose from 'mongoose';

// ============================================================
// 1. PUBLIC: FETCH MENU (With CEO Kill Switch)
// ============================================================
export const getDishes = async (req, res) => {
    const { restaurantId } = req.query; 

    try {
        if (!restaurantId) return res.status(400).json({ message: "ID required" });

        let owner;
        
        // 🕵️ SMART LOOKUP: Find Owner by ID or Username
        if (mongoose.Types.ObjectId.isValid(restaurantId)) {
            owner = await Owner.findById(restaurantId).select('_id settings').lean();
        } else {
            owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + restaurantId + "$", "i") } 
            }).select('_id settings').lean();
        }

        // Safety Check: If owner doesn't exist, return empty list (No crash)
        if (!owner) return res.json([]); 

        // 🛑 THE KILL SWITCH ENFORCEMENT 🛑
        // This is what makes your "MENU OFF" button actually work!
        if (owner.settings && owner.settings.menuActive === false) {
            return res.status(503).json({ message: "❌ SERVICE SUSPENDED BY ADMIN" });
        }

        // 🚀 PRO FETCH: Get dishes if the Menu is Active
        const dishes = await Dish.find({ restaurantId: owner._id })
            .select('-reviews') 
            .sort({ isAvailable: -1, "ratings.average": -1 })
            .lean();

        res.status(200).json(dishes);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ message: "Sync Node Error" });
    }
};

// ... (Keep your addDishReview, createDish, updateDish, deleteDish exactly as they are in your code)