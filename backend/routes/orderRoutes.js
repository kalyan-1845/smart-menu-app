import express from 'express';
import Order from '../models/Order.js';
import Call from '../models/Call.js'; // Ensure you have created this model
import { protect, checkSubscription } from '../middleware/authMiddleware.js';

import webpush from 'web-push';

// Configure VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Trigger this inside your "Place Order" function
export const sendOrderNotification = async (ownerSubscription, orderData) => {
    const payload = JSON.stringify({
        title: "🔥 New Order Received!",
        body: `Table ${orderData.tableNumber} just ordered ${orderData.items.length} items. Total: ₹${orderData.totalAmount}`,
        icon: "/logo192.png",
    });

    try {
        await webpush.sendNotification(ownerSubscription, payload);
        console.log("Push sent to Owner");
    } catch (err) {
        console.error("Error sending push", err);
    }
};
const router = express.Router();

   
/**
 * 1. PLACE ORDER (Public)
 * Used by customers in Cart.jsx to send their selection to the kitchen.
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

        // 🚀 Real-time alert to Chef & Waiter
        if (req.io) {
            req.io.emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 2. CALL WAITER (Public)
 * Used by customers in OrderTracker.jsx for specific service requests.
 */
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body; // type: 'help', 'bill', or 'water'

        if (!tableNumber || tableNumber === "Takeaway") {
            return res.status(400).json({ message: "Valid table number required." });
        }

        // Save the request to the database so staff can see it even if they refresh
        const newCall = await Call.create({
            restaurantId,
            tableNumber,
            type: type || 'help'
        });

        // 🚀 Real-time alert to Waiter Dashboard
        if (req.io) {
            req.io.emit('new-waiter-call', newCall);
        }

        res.status(201).json({ message: "Staff notified!", call: newCall });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * 3. TRACK SINGLE ORDER (Public)
 * Used by OrderTracker.jsx to get live status updates.
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

/**
 * 4. GET ALL ACTIVE CALLS (Protected)
 * Used by WaiterDashboard.jsx to list current service requests.
 */
router.get('/calls', protect, async (req, res) => {
    try {
        const restaurantId = req.query.restaurantId;
        const calls = await Call.find({ restaurantId }).sort({ createdAt: 1 });
        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * 5. RESOLVE / DELETE CALL (Protected)
 * Used by staff to clear a request once the table is attended.
 */
router.delete('/calls/:id', protect, async (req, res) => {
    try {
        const call = await Call.findByIdAndDelete(req.params.id);
        if (req.io && call) {
            req.io.emit('call-resolved', { 
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
 * 6. GET ALL ORDERS (Protected)
 * Used by dashboards to fetch current restaurant orders.
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
 * 7. UPDATE ORDER STATUS (Protected)
 * Used by Chef/Waiter to move order from PLACED -> COOKING -> READY -> SERVED.
 */
router.put('/:id', protect, checkSubscription, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );
        
        // 🚀 Emit update so customer's phone updates automatically
        if (req.io) req.io.emit('order-updated', order);
        
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;