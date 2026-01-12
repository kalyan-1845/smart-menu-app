import express from 'express';
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// --- 🛡️ MIDDLEWARE ---
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
// 🛒 1. PLACE ORDER
// ============================================================
router.post('/', async (req, res) => {
    try {
        const { restaurantId, tableNum, items, totalAmount, customerName, paymentMethod, customerId } = req.body;

        const newOrder = new Order({
            restaurantId,
            tableNum: tableNum.toString(), // Handles "Parcel" or "1"
            items,
            totalAmount,
            customerName: customerName || "Guest",
            paymentMethod: paymentMethod || "Pay Later",
            customerId: customerId,
            status: "Pending"
        });

        const savedOrder = await newOrder.save();

        if (req.io) {
            // Notify Admin Dashboard
            req.io.to(restaurantId).emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("❌ ORDER SAVE FAILED:", error.message); 
        res.status(500).json({ message: "Order Failed", error: error.message });
    }
});

// ============================================================
// 📥 2. GET INBOX (Admin Dashboard)
// ============================================================
router.get('/inbox', async (req, res) => {
    const { restaurantId } = req.query;
    try {
        // ✅ UPDATED: We INCLUDE 'completed' orders so the Stats Panel can calculate revenue.
        // The Frontend filters them out for the Table Grid view.
        const orders = await Order.find({ 
            restaurantId,
            status: { $nin: ['archived'] } // Only hide archived (deleted/cleared) orders
        }).sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Fetch Failed" });
    }
});

// ============================================================
// 👨‍🍳 3. UPDATE STATUS (Complete Table / Cancel)
// ============================================================
// ✅ UPDATED URL: Matches frontend `axios.put(..., /status)`
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body; 
        
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );

        if (req.io) {
            // Alert Admin Dashboard to refresh
            req.io.to(updatedOrder.restaurantId.toString()).emit('new-order', updatedOrder);
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: "Update Failed" });
    }
});

// ============================================================
// 🛎️ 4. SERVICE CALLS
// ============================================================

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

router.delete('/calls/:id', async (req, res) => {
    try {
        await Call.findByIdAndDelete(req.params.id);
        res.json({ message: "Call resolved" });
    } catch (error) {
        res.status(500).json({ message: "Error resolving" });
    }
});

// ============================================================
// 🧹 5. MARK DOWNLOADED (Clear History)
// ============================================================
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        // ✅ UPDATED: Archives 'Completed' orders too (when owner clicks Clear History)
        await Order.updateMany(
            { restaurantId, status: { $in: ['Served', 'Paid', 'Completed', 'Cancelled'] } },
            { $set: { status: 'archived', isDownloaded: true } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Clear Failed" });
    }
});

// ============================================================
// 🔍 6. GET SINGLE ORDER
// ============================================================
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        res.json(order);
    } catch (e) { res.status(404).json({ message: "Not found" }); }
});

export default router;