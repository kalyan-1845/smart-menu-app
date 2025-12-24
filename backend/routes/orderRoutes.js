import express from 'express';
import webpush from 'web-push';
import Order from '../models/Order.js';
import Call from '../models/Call.js';
import Owner from '../models/Owner.js'; // Needed to fetch push subscription
import { protect, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- 1. PUSH NOTIFICATION CONFIG ---
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Helper: Send Push Notification to Owner
 */
const sendOrderNotification = async (restaurantId, orderData) => {
    try {
        const owner = await Owner.findById(restaurantId);
        // Only send if the owner has a saved push subscription
        if (owner && owner.pushSubscription) {
            const payload = JSON.stringify({
                title: "🔥 New Order Received!",
                body: `Table ${orderData.tableNumber} ordered ${orderData.items.length} items. Total: ₹${orderData.totalAmount}`,
                icon: "/logo192.png",
                data: { url: `/${owner.username}/admin` }
            });
            await webpush.sendNotification(JSON.parse(owner.pushSubscription), payload);
        }
    } catch (err) {
        console.error("Push notification failed:", err);
    }
};

// --- 2. PUBLIC ROUTES (Customer Facing) ---

/**
 * @route   POST /api/orders
 * @desc    Place a new order (Public)
 */
router.post('/', async (req, res) => {
    try {
        const { customerName, tableNumber, items, totalAmount, owner, paymentMethod, status } = req.body;
        
        const newOrder = new Order({ 
            customerName, 
            tableNumber, 
            items, 
            totalAmount, 
            paymentMethod,
            status: status || "PLACED",
            owner 
        });

        const savedOrder = await newOrder.save();

        // 🚀 Real-time alert to Chef & Waiter (Socket.io)
        if (req.io) {
            req.io.to(owner).emit('new-order', savedOrder);
        }

        // 🔔 Send Web Push to Owner's device
        sendOrderNotification(owner, savedOrder);

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * @route   POST /api/orders/call-waiter
 * @desc    Service request from customer (Public)
 */
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body;

        if (!tableNumber || tableNumber === "Takeaway") {
            return res.status(400).json({ message: "Valid table number required." });
        }

        const newCall = await Call.create({
            restaurantId,
            tableNumber,
            type: type || 'help'
        });

        // 🚀 Real-time alert to staff dashboard
        if (req.io) {
            req.io.to(restaurantId).emit('new-waiter-call', newCall);
        }

        res.status(201).json({ message: "Staff notified!", call: newCall });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/orders/track/:id
 * @desc    Track status of a single order (Public)
 */
router.get('/track/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found." });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 3. PROTECTED ROUTES (Staff Facing) ---

/**
 * @route   GET /api/orders/calls
 * @desc    Fetch active service requests (Protected)
 */
router.get('/calls', protect, async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const calls = await Call.find({ restaurantId }).sort({ createdAt: 1 });
        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/orders/calls/:id
 * @desc    Resolve a service request (Protected)
 */
router.delete('/calls/:id', protect, async (req, res) => {
    try {
        const call = await Call.findByIdAndDelete(req.params.id);
        if (req.io && call) {
            req.io.to(call.restaurantId.toString()).emit('call-resolved', { 
                restaurantId: call.restaurantId, 
                tableNumber: call.tableNumber 
            });
        }
        res.json({ message: "Call resolved." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/orders
 * @desc    Fetch all orders for owner dashboard (Protected)
 */
router.get('/', protect, checkSubscription, async (req, res) => {
    try {
        const orders = await Order.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order status or payment status (Protected)
 */
router.put('/:id', protect, checkSubscription, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, // Can update status, paymentStatus, etc.
            { new: true }
        );
        
        // 🚀 Socket emit so customer tracker updates live
        if (req.io) req.io.emit('order-updated', order);
        
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;