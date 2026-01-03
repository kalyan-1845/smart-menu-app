import express from 'express';
import mongoose from 'mongoose'; 
import webpush from 'web-push'; 
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- 🔑 SAFE WEB PUSH CONFIGURATION ---
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails('mailto:support@bitebox.com', publicKey, privateKey);
    } catch (err) { console.error("❌ Push Config Error"); }
}

// --- 1. PLACE ORDER ---
router.post('/', async (req, res) => {
    try {
        const { customerName, items, totalAmount, paymentMethod, tableNum, restaurantId } = req.body;
        
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

        if (req.io) {
            req.io.to(restaurantId.toString()).emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// ✅ --- 2. GET LIVE INBOX (Unfiltered for Admin) ---
router.get('/inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        // Only fetch orders that haven't been "Saved & Cleared" (isDownloaded: false)
        const orders = await Order.find({ restaurantId, isDownloaded: false }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- 3. GET ALL ORDERS (Chef/Waiter Filtered) ---
router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        // Fetch orders for the staff dashboards
        const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 }).limit(50);
        res.json(orders);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- 4. UPDATE STATUS (Chef & Hybrid Actions) ---
router.put('/:id', async (req, res) => {
    try {
        const oldOrder = await Order.findById(req.params.id);
        if (!oldOrder) return res.status(404).json({ message: "Order not found" });

        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );

        // 💰 REVENUE: Auto-calculate when status becomes "Served"
        if (req.body.status.toLowerCase() === "served" && oldOrder.status.toLowerCase() !== "served") {
            await Owner.findByIdAndUpdate(order.restaurantId, {
                $inc: { totalRevenue: order.totalAmount }
            });
        }

        // 📡 Real-time update to all dashboards and customer tracking
        if (req.io) {
             req.io.to(order.restaurantId.toString()).emit('order-updated', order);
             // If Ready, specifically alert the Waiter Terminal
             if (req.body.status.toLowerCase() === "ready") {
                req.io.to(order.restaurantId.toString()).emit('chef-ready-alert', order);
             }
        }

        res.json(order);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// --- 5. CALL WAITER ---
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber } = req.body; 
        const newCall = await Call.create({ restaurantId, tableNumber, type: 'help' });
        
        if (req.io) {
            req.io.to(restaurantId.toString()).emit('new-waiter-call', newCall);
        }
        
        res.status(201).json(newCall);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- 6. GET ACTIVE CALLS ---
router.get('/calls', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const calls = await Call.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(calls);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- 7. CLEAR INBOX (Mark as Downloaded) ---
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        await Order.updateMany({ restaurantId, isDownloaded: false }, { $set: { isDownloaded: true } });
        res.status(200).json({ message: "Inbox cleared" });
    } catch (error) { res.status(500).json({ error: "Failed" }); }
});

// --- 8. DELETE CALL ---
router.delete('/calls/:callId', async (req, res) => {
    try {
        await Call.findByIdAndDelete(req.params.callId);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Failed" }); }
});

export default router;