import express from 'express';
import Order from '../models/Order.js';
import Call from '../models/Call.js'; // ✅ Import Call Model
import Owner from '../models/Owner.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// --- 🛡️ MIDDLEWARE (Retained) ---
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'fallback_secret';
            const decoded = jwt.verify(token, secret);
            req.user = await Owner.findById(decoded.id).select('_id'); 
            if (!req.user) return res.status(401).json({ message: 'User session expired' });
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
    } else {
        return res.status(401).json({ message: 'No authorization token' });
    }
};

// ============================================================
// 🛒 1. PLACE ORDER (Enhanced for Parcel)
// ============================================================
router.post('/', async (req, res) => {
    try {
        const { restaurantId, tableNum, items, totalAmount, customerName, paymentMethod, customerId } = req.body;

        const newOrder = new Order({
            restaurantId,
            tableNum: tableNum.toString(), // ✅ Ensures "Parcel" is saved as String
            items,
            totalAmount,
            customerName: customerName || "Guest",
            paymentMethod: paymentMethod || "Cash",
            customerId: customerId,
            status: "Pending" // ✅ Standardized for Chef Dashboard
        });

        const savedOrder = await newOrder.save();

        if (req.io) {
            // Notify Kitchen (Chef)
            req.io.to(restaurantId).emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("❌ ORDER SAVE FAILED:", error.message); 
        res.status(500).json({ message: "Order Failed", error: error.message });
    }
});

// ============================================================
// 📥 2. GET INBOX (Staff/Chef)
// ============================================================
router.get('/inbox', async (req, res) => {
    const { restaurantId } = req.query;
    try {
        // Fetch orders that are NOT archived/downloaded
        const orders = await Order.find({ 
            restaurantId,
            status: { $nin: ['archived', 'completed'] } // Keep 'served' visible until cleared
        }).sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Fetch Failed" });
    }
});

// ============================================================
// 👨‍🍳 3. UPDATE STATUS (Chef/Waiter)
// ============================================================
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body; 
        
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );

        if (req.io) {
            // 📢 Alert Customer (OrderTracker)
            req.io.to(req.params.id).emit('order-status-updated', updatedOrder);

            // 📢 Alert Chef/Waiter Dashboards
            req.io.to(updatedOrder.restaurantId.toString()).emit('new-order', updatedOrder);

            // Special: Ready Alert
            if (status.toLowerCase() === 'ready') {
                req.io.to(updatedOrder.restaurantId.toString()).emit('chef-ready-alert', updatedOrder);
            }
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: "Update Failed" });
    }
});

// ============================================================
// 🛎️ 4. SERVICE CALLS (Waiter Button Logic)
// ============================================================

// A. Create Call (Customer clicks button)
router.post('/calls', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body;

        const newCall = new Call({
            restaurantId,
            tableNumber: tableNumber.toString(),
            type: type || 'help',
            status: 'pending'
        });

        const savedCall = await newCall.save();

        if (req.io) {
            req.io.to(restaurantId).emit("new-waiter-call", savedCall);
        }

        res.status(201).json(savedCall);
    } catch (error) {
        console.error("Call Error:", error);
        res.status(500).json({ message: "Failed to call waiter" });
    }
});

// B. Get Active Calls (Waiter Dashboard)
router.get('/calls', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const calls = await Call.find({ 
            restaurantId, 
            status: 'pending' 
        }).sort({ createdAt: -1 });
        
        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: "Sync error" });
    }
});

// C. Resolve Call (Waiter clicks checkmark)
router.delete('/calls/:id', async (req, res) => {
    try {
        await Call.findByIdAndDelete(req.params.id);
        res.json({ message: "Call resolved" });
    } catch (error) {
        res.status(500).json({ message: "Error resolving" });
    }
});

// ============================================================
// 🧹 5. MARK DOWNLOADED (Admin Panel)
// ============================================================
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        await Order.updateMany(
            { restaurantId, status: { $in: ['Served', 'Paid'] } },
            { $set: { status: 'archived', isDownloaded: true } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Clear Failed" });
    }
});

// ============================================================
// 🔍 6. GET SINGLE ORDER (For Tracker)
// ============================================================
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        res.json(order);
    } catch (e) { res.status(404).json({ message: "Not found" }); }
});

export default router;