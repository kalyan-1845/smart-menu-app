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

        // Fix: Convert Username to ID if necessary
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
            status: finalStatus
        });

        const savedOrder = await newOrder.save();

        if (req.io) {
            req.io.to(finalRestaurantId.toString()).emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("Order Error:", error.message);
        res.status(400).json({ message: error.message });
    }
});

// --- 2. GET SINGLE ORDER (CRITICAL FOR TRACKER) ---
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 3. GET ALL ORDERS (CHEF) ---
router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });
        const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 4. UPDATE STATUS (CHEF BUTTONS) ---
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );
        if (req.io && order) {
             // Emit to Restaurant Room (Chef) AND Order Room (Tracker)
             req.io.to(order.restaurantId.toString()).emit('order-updated', order);
             req.io.emit('order-updated', order); // Broadcast to be safe for tracker
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
        if (req.io) req.io.emit('new-waiter-call', newCall);
        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// ... existing imports ...

// --- NEW ROUTE: GET INBOX (Only non-downloaded orders) ---
router.get('/inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });

        // Fetch orders that are NOT downloaded yet
        const orders = await Order.find({ 
            restaurantId, 
            isDownloaded: false 
        }).sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- NEW ROUTE: CLEAR INBOX (Mark as downloaded) ---
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        
        // Update all orders for this restaurant to isDownloaded: true
        await Order.updateMany(
            { restaurantId, isDownloaded: false },
            { $set: { isDownloaded: true } }
        );

        res.status(200).json({ message: "Inbox cleared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear inbox" });
    }
});

// ... your existing routes (GET /:id, GET /, etc.) ...

export default router;