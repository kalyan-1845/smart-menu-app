import express from 'express';
import mongoose from 'mongoose'; 
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

// ---------------------------------------------------------
// 🏆 NUCLEAR FIX: Renamed Route '/admin-inbox'
// ---------------------------------------------------------
router.get('/admin-inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId || restaurantId === 'undefined') {
            return res.status(400).json({ message: "Restaurant ID is missing" });
        }

        const orders = await Order.find({ 
            restaurantId: restaurantId, 
            isDownloaded: false 
        }).sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ... (Rest of your standard order routes go here, below the admin-inbox) ...

// Standard Place Order
router.post('/', async (req, res) => {
    try {
        const { customerName, items, totalAmount, paymentMethod, tableNum, restaurantId, owner, status } = req.body;
        let finalId = restaurantId || owner;
        
        // Ensure ID is valid
        if (!mongoose.Types.ObjectId.isValid(finalId)) {
            const user = await Owner.findOne({ username: finalId });
            if (user) finalId = user._id;
        }

        const newOrder = new Order({ 
            customerName, tableNum, restaurantId: finalId, items, totalAmount, paymentMethod, 
            status: status || "Pending", isDownloaded: false 
        });

        const savedOrder = await newOrder.save();
        if (req.io) req.io.to(finalId.toString()).emit('new-order', savedOrder);
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        await Order.updateMany({ restaurantId, isDownloaded: false }, { $set: { isDownloaded: true } });
        res.json({ message: "Cleared" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (req.body.status === "Served" && order) {
            await Owner.findByIdAndUpdate(order.restaurantId, { $inc: { totalRevenue: order.totalAmount } });
        }
        if (req.io && order) {
             req.io.to(order.restaurantId.toString()).emit('order-updated', order);
             req.io.emit('order-updated', order);
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Keep generic ID route LAST
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        res.json(order);
    } catch (error) {
        res.status(404).json({ message: "Not found" });
    }
});

export default router;