import express from 'express';
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// --- 🛡️ MIDDLEWARE: Protect Routes ---
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
// 🛒 1. PLACE ORDER (Customer Side)
// ============================================================
router.post('/', async (req, res) => {
    try {
        const { restaurantId, tableNum, items, totalAmount, customerName, paymentMethod, customerId } = req.body;

        const newOrder = new Order({
            restaurantId,
            tableNum: tableNum.toString(), // Ensures "Parcel" or "VIP 1" works
            items,
            totalAmount,
            customerName: customerName || "Guest",
            paymentMethod: paymentMethod || "Pay Later",
            customerId: customerId,
            status: "Pending"
        });

        const savedOrder = await newOrder.save();

        if (req.io) {
            // ✅ Event: 'new-order' (Adds a new card to Admin Panel)
            req.io.to(restaurantId).emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("❌ ORDER SAVE FAILED:", error.message); 
        res.status(500).json({ message: "Order Failed", error: error.message });
    }
});

// ============================================================
// 📥 2. GET INBOX (Admin Dashboard - Polling)
// ============================================================
router.get('/inbox', async (req, res) => {
    const { restaurantId } = req.query;
    try {
        // ✅ Returns all active orders AND completed ones (for Stats calculation)
        // Frontend handles filtering based on the active Tab
        const orders = await Order.find({ 
            restaurantId,
            status: { $nin: ['archived'] } // Hides only deleted/archived orders
        }).sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Fetch Failed" });
    }
});

// ============================================================
// 👨‍🍳 3. UPDATE STATUS (Kitchen/Counter Actions)
// ============================================================
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body; 
        
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (req.io) {
            // ✅ FIX: Emit 'order-updated' instead of 'new-order' to prevent duplicates
            req.io.to(updatedOrder.restaurantId.toString()).emit('order-updated', updatedOrder);
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: "Update Failed" });
    }
});

// ============================================================
// 🛎️ 4. SERVICE CALLS (Waiter Bell)
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
// 🧹 5. MARK DOWNLOADED (Clear History / End of Day)
// ============================================================
router.put('/mark-downloaded', protect, async (req, res) => {
    try {
        const { restaurantId } = req.body;
        // Archives 'Served', 'Paid', 'Completed', 'Cancelled'
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
// 🔍 6. GET SINGLE ORDER (For Receipt Page)
// ============================================================
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Not found" });
        res.json(order);
    } catch (e) { 
        res.status(404).json({ message: "Not found" }); 
    }
});

export default router;