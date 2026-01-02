import express from 'express';
import mongoose from 'mongoose'; 
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- 1. PLACE ORDER ---
router.post('/', async (req, res) => {
    try {
        const { customerName, items, totalAmount, paymentMethod, tableNum, tableNumber, restaurantId, owner, status } = req.body;
        
        const finalTableNum = tableNum || tableNumber;
        let finalRestaurantId = restaurantId || owner;
        const finalStatus = status || "Pending"; 

        if (!finalRestaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
        if (!finalTableNum) return res.status(400).json({ message: "Table Number is required" });

        if (!mongoose.Types.ObjectId.isValid(finalRestaurantId)) {
            const restaurantOwner = await Owner.findOne({ username: finalRestaurantId });
            if (!restaurantOwner) return res.status(404).json({ message: "Restaurant not found." });
            finalRestaurantId = restaurantOwner._id;
        }

        const newOrder = new Order({ 
            customerName, 
            tableNum: finalTableNum,       
            restaurantId: finalRestaurantId, 
            items, 
            totalAmount, 
            paymentMethod,
            status: finalStatus,
            isDownloaded: false 
        });

        const savedOrder = await newOrder.save();

        if (req.io) {
            req.io.to(finalRestaurantId.toString()).emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- 2. GET SINGLE ORDER ---
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Order ID" });
        }
        const order = await Order.findById(req.params.id);
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 3. GET ALL ORDERS (CHEF VIEW) ---
router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "ID required" });
        const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 4. UPDATE STATUS & REVENUE ---
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        
        if (!order) return res.status(404).json({ message: "Not found" });

        // Revenue logic preserved
        if (status === "Served") {
            await Owner.findByIdAndUpdate(order.restaurantId, {
                $inc: { totalRevenue: order.totalAmount }
            });
        }

        if (req.io) {
             req.io.to(order.restaurantId.toString()).emit('order-updated', order);
             req.io.emit('order-updated', order); 
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- 5. CALL WAITER ---
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body; 
        const newCall = await Call.create({ restaurantId, tableNumber, type: type || 'help' });
        if (req.io) req.io.to(restaurantId.toString()).emit('new-waiter-call', newCall);
        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 6. GET INBOX (Universal ID Fix) ---
router.get('/inbox', async (req, res) => {
    try {
        // Fix: Detects ID from query OR URL segment to prevent 400 errors
        const restaurantId = req.query.restaurantId || req.params.restaurantId;

        if (!restaurantId || restaurantId === 'undefined') {
            return res.status(400).json({ message: "Restaurant ID required" });
        }

        const orders = await Order.find({ 
            restaurantId, 
            isDownloaded: false 
        }).sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 7. MARK DOWNLOADED ---
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        await Order.updateMany({ restaurantId, isDownloaded: false }, { $set: { isDownloaded: true } });
        res.status(200).json({ message: "Cleared" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;