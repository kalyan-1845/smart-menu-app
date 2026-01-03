import express from 'express';
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- 1. PLACE NEW ORDER ---
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

// ✅ --- 2. GET LIVE INBOX (For Dashboard Sync) ---
router.get('/inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        // Fetch only active orders that haven't been archived/downloaded
        const orders = await Order.find({ 
            restaurantId, 
            isDownloaded: false 
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- 3. GET ALL ORDERS (Staff Dashboards) ---
router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 }).limit(50);
        res.json(orders);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- 4. UPDATE STATUS & AUTO-REVENUE ---
router.put('/:id', async (req, res) => {
    try {
        const oldOrder = await Order.findById(req.params.id);
        if (!oldOrder) return res.status(404).json({ message: "Order not found" });

        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );

        // 💰 REVENUE: Only increment when status FIRST becomes "Served"
        if (req.body.status.toLowerCase() === "served" && oldOrder.status.toLowerCase() !== "served") {
            await Owner.findByIdAndUpdate(order.restaurantId, {
                $inc: { totalRevenue: order.totalAmount }
            });
        }

        if (req.io) {
             req.io.to(order.restaurantId.toString()).emit('order-updated', order);
             if (req.body.status.toLowerCase() === "ready") {
                req.io.to(order.restaurantId.toString()).emit('chef-ready-alert', order);
             }
        }

        res.json(order);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// --- 5. CALL WAITER (Real-time Alert) ---
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body; 
        const newCall = await Call.create({ 
            restaurantId, 
            tableNumber, 
            type: type || 'help' 
        });
        
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

// --- 7. RESOLVE/DELETE CALL ---
router.delete('/calls/:callId', async (req, res) => {
    try {
        const call = await Call.findById(req.params.callId);
        if (!call) return res.status(404).json({ message: "Call not found" });

        await Call.findByIdAndDelete(req.params.callId);

        if (req.io) {
            req.io.to(call.restaurantId.toString()).emit("call-resolved", { id: req.params.callId });
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Failed" }); }
});

// --- 8. CLEAR INBOX ---
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        await Order.updateMany({ restaurantId, isDownloaded: false }, { $set: { isDownloaded: true } });
        res.status(200).json({ message: "Inbox cleared" });
    } catch (error) { res.status(500).json({ error: "Failed" }); }
});

export default router;