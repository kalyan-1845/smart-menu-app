import express from 'express';
import mongoose from 'mongoose'; // Added for ID validation
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- 1. PLACE NEW ORDER ---
router.post('/', async (req, res) => {
    try {
        const { customerName, items, totalAmount, paymentMethod, tableNum, restaurantId } = req.body;
        
        // Safety: Prevent crash if frontend sends a username instead of ID
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }

        const newOrder = new Order({ 
            customerName, 
            tableNum,       
            restaurantId, 
            items, 
            totalAmount, 
            paymentMethod,
            status: "Pending",
            isDownloaded: false 
        });

        const savedOrder = await newOrder.save();
        if (req.io) req.io.to(restaurantId.toString()).emit('new-order', savedOrder);

        res.status(201).json(savedOrder);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// ✅ --- 2. GET LIVE INBOX (Dashboard Sync - FIXED 500 ERROR) ---
router.get('/inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        // 🛡️ STOP CRASH: Check ID validity
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.json([]); 
        }
        const orders = await Order.find({ restaurantId, isDownloaded: false }).sort({ createdAt: -1 }).lean();
        res.json(orders);
    } catch (error) { res.status(500).json({ message: "Inbox Sync Error" }); }
});

// ✅ --- 3. GET ALL ORDERS (Staff Dashboards - FIXED 500 ERROR) ---
router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        // 🛡️ STOP CRASH: Check ID validity
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.json([]); 
        }
        const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 }).limit(50).lean();
        res.json(orders);
    } catch (error) { res.status(500).json({ message: "Order Sync Error" }); }
});

// --- 4. UPDATE STATUS & AUTO-REVENUE ---
router.put('/:id', async (req, res) => {
    try {
        const oldOrder = await Order.findById(req.params.id);
        if (!oldOrder) return res.status(404).json({ message: "Order not found" });

        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });

        if (req.body.status.toLowerCase() === "served" && oldOrder.status.toLowerCase() !== "served") {
            await Owner.findByIdAndUpdate(order.restaurantId, { $inc: { totalRevenue: order.totalAmount } });
        }

        if (req.io) req.io.to(order.restaurantId.toString()).emit('order-updated', order);
        res.json(order);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// ✅ --- 5. GET ACTIVE CALLS (FIXED 500 ERROR) ---
router.get('/calls', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.json([]); 
        }
        const calls = await Call.find({ restaurantId }).sort({ createdAt: -1 }).lean();
        res.json(calls);
    } catch (error) { res.status(500).json({ message: "Call Sync Error" }); }
});

// ... (Keep routes 5, 7, and 8 as you have them)

export default router;