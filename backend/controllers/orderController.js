import express from 'express';
import mongoose from 'mongoose'; 
import webpush from 'web-push'; 
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- 🔑 WEB PUSH CONFIG ---
const publicKey = process.env.PUBLIC_VAPID_KEY;
const privateKey = process.env.PRIVATE_VAPID_KEY;

if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails('mailto:support@bitebox.com', publicKey, privateKey);
    } catch (err) { console.error("Push Init Error"); }
}

// ============================================================
// 1. PLACE ORDER (Menu Flow)
// ============================================================
router.post('/', async (req, res) => {
    try {
        let { restaurantId, owner, tableNum, tableNumber, items, totalAmount, paymentMethod, status } = req.body;
        
        let finalRestaurantId = restaurantId || owner;
        const finalTableNum = tableNum || tableNumber;

        if (!finalRestaurantId) return res.status(400).json({ message: "ID required" });

        // Resolve Username to ID
        if (!mongoose.Types.ObjectId.isValid(finalRestaurantId)) {
            const restaurantOwner = await Owner.findOne({ username: finalRestaurantId.toLowerCase() });
            if (!restaurantOwner) return res.status(404).json({ message: "Restaurant not found" });
            finalRestaurantId = restaurantOwner._id;
        }

        const newOrder = new Order({ 
            ...req.body, 
            restaurantId: finalRestaurantId, 
            tableNum: finalTableNum,
            status: status || "Pending" 
        });

        const savedOrder = await newOrder.save();

        if (req.io) req.io.to(finalRestaurantId.toString()).emit('new-order', savedOrder);

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ============================================================
// 2. GET ORDERS (Dashboard Sync - WITH KILL SWITCH)
// ============================================================
router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        
        // 🛡️ CRITICAL: Stop the crash if ID is invalid
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.json([]); 
        }

        // 🛑 KITCHEN KILL SWITCH ENFORCEMENT 🛑
        // This stops the kitchen from working if you turned it OFF in God Mode
        const owner = await Owner.findById(restaurantId).select('settings').lean();
        if (owner && owner.settings && owner.settings.chefActive === false) {
             // Return a special error that the frontend can show as a "Lock Screen"
             return res.status(403).json({ message: "🔒 KITCHEN LOCKED BY CEO" });
        }

        const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 }).lean();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Sync Error" });
    }
});

// ============================================================
// 3. GET WAITER CALLS
// ============================================================
router.get('/calls', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.json([]); 
        }
        const calls = await Call.find({ restaurantId }).sort({ createdAt: -1 }).lean();
        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: "Calls Error" });
    }
});

// ============================================================
// 4. UPDATE STATUS & REVENUE
// ============================================================
router.put('/:id', async (req, res) => {
    try {
        const oldOrder = await Order.findById(req.params.id);
        if (!oldOrder) return res.status(404).json({ message: "Order not found" });

        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );

        // 💰 Revenue logic
        if (req.body.status.toLowerCase() === "served" && oldOrder.status.toLowerCase() !== "served") {
            await Owner.findByIdAndUpdate(order.restaurantId, {
                $inc: { totalRevenue: order.totalAmount }
            });
        }

        if (req.io) req.io.to(order.restaurantId.toString()).emit('order-updated', order);
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: "Update failed" });
    }
});

// ============================================================
// 5. CALL WAITER & UTILS
// ============================================================
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body; 
        const newCall = await Call.create({ restaurantId, tableNumber, type: type || 'help' });
        if (req.io) req.io.to(restaurantId.toString()).emit('new-waiter-call', newCall);
        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: "Call failed" });
    }
});

router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        await Order.updateMany({ restaurantId, isDownloaded: false }, { $set: { isDownloaded: true } });
        res.json({ message: "Cleared" });
    } catch (error) {
        res.status(500).json({ error: "Clear failed" });
    }
});

router.delete('/calls/:callId', async (req, res) => {
    try {
        await Call.findByIdAndDelete(req.params.callId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed" });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Delete failed" });
    }
});

export default router;