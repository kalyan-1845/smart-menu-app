import express from 'express';
import Order from '../models/Order.js';
import { protect, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 1. PLACE ORDER (Public)
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

        // Real-time alert to Chef
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
 */
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber } = req.body;

        if (!tableNumber || tableNumber === "Takeaway") {
            return res.status(400).json({ message: "Table number required." });
        }

        if (req.io) {
            req.io.emit('waiter-call', { 
                tableNumber, 
                time: new Date().toLocaleTimeString(),
                restaurantId 
            });
        }

        res.status(200).json({ message: "Waiter notified!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * 3. GET ORDERS (Protected)
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
 * 4. UPDATE STATUS (Protected)
 */
router.put('/:id', protect, checkSubscription, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (req.io) req.io.emit('order-updated', order);
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;