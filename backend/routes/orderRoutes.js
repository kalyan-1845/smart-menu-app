import express from 'express';
import Order from '../models/Order.js';
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
        const { restaurantId, tableNum, items, totalAmount, customerName, paymentMethod } = req.body;

        const newOrder = new Order({
            restaurantId,
            tableNum,
            items,
            totalAmount,
            customerName: customerName || "Guest",
            paymentMethod: paymentMethod || "Cash",
            status: "placed"
        });

        const savedOrder = await newOrder.save();

        if (req.io) {
            // Notify Kitchen
            req.io.to(restaurantId).emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(500).json({ message: "Order Failed" });
    }
});

// ============================================================
// 📥 2. GET INBOX (Staff)
// ============================================================
router.get('/inbox', async (req, res) => {
    const { restaurantId } = req.query;
    try {
        const orders = await Order.find({ 
            restaurantId,
            isDownloaded: { $ne: true }
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Fetch Failed" });
    }
});

// ============================================================
// 👨‍🍳 3. UPDATE STATUS & TRIGGER AUTO-DOWNLOAD
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
            // 📢 BROADCAST TO CUSTOMER (This triggers the auto-download)
            req.io.to(req.params.id).emit('chef-ready-alert', {
                orderId: updatedOrder._id,
                status: updatedOrder.status,
                restaurantId: updatedOrder.restaurantId
            });

            // 📢 BROADCAST TO STAFF (To sync other dashboards)
            req.io.to(updatedOrder.restaurantId.toString()).emit('order-updated', updatedOrder);
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: "Update Failed" });
    }
});

// ============================================================
// 🧹 4. MARK DOWNLOADED
// ============================================================
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        await Order.updateMany(
            { restaurantId, isDownloaded: { $ne: true } },
            { $set: { isDownloaded: true, status: 'archived' } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Clear Failed" });
    }
});

// ============================================================
// 🔍 5. GET SINGLE ORDER (For Tracker)
// ============================================================
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        res.json(order);
    } catch (e) { res.status(404).json({ message: "Not found" }); }
});

export default router;