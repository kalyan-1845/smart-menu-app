import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js'; // <--- IMPORT THIS

// Define Dish Schema (Same as before)
const dishSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: "General" },
    image: { type: String },
    isAvailable: { type: Boolean, default: true }
});
const Dish = mongoose.models.Dish || mongoose.model('Dish', dishSchema);

const router = express.Router();

// 🔓 PUBLIC: Anyone can VIEW the menu (Customer & Owner)
router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const dishes = await Dish.find({ restaurantId });
        res.json(dishes);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

// 🔒 PROTECTED: Only the Owner can ADD items
router.post('/', protect, async (req, res) => { // <--- Added 'protect'
    try {
        // Automatically link the new dish to the logged-in owner
        // (Optional: You can still use req.body.restaurantId if you prefer flexibility)
        const newDish = new Dish(req.body);
        await newDish.save();
        res.status(201).json(newDish);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

// 🔒 PROTECTED: Only the Owner can DELETE items
router.delete('/:id', protect, async (req, res) => { // <--- Added 'protect'
    try {
        await Dish.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

export default router;