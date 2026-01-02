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

        // Fix: Convert Username to ID if necessary for multi-tenant support
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
            isDownloaded: false // Default to false so it shows in Admin Inbox
        });

        const savedOrder = await newOrder.save();

        // Socket emit to specific restaurant room for real-time staff alerts
        if (req.io) {
            req.io.to(finalRestaurantId.toString()).emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("Order Error:", error.message);
        res.status(400).json({ message: error.message });
    }
});

// --- 2. GET SINGLE ORDER (CRITICAL FOR CUSTOMER TRACKER) ---
router.get('/:id', async (req, res) => {
    try {
        // Validation check for Mongo ID format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Order ID format" });
        }
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 3. GET ALL ORDERS (CHEF/WAITER VIEW) ---
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

// --- 4. UPDATE STATUS (CHEF ACTIONS) ---
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        
        // 1. Update the order
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        );
        
        if (!order) return res.status(404).json({ message: "Order not found" });

        // 2. REVENUE LOGIC: If order is marked "Served", increment owner's revenue
        if (status === "Served") {
            await Owner.findByIdAndUpdate(order.restaurantId, {
                $inc: { totalRevenue: order.totalAmount }
            });
        }

        // 3. Real-time notifications
        if (req.io) {
             // Notify both the Restaurant Staff and the Customer Tracker
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
        
        if (req.io) {
            // Target only the specific restaurant staff room
            req.io.to(restaurantId.toString()).emit('new-waiter-call', newCall);
        }
        
        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 6. GET INBOX (Only non-downloaded orders for Admin/PDF generation) ---
router.get('/inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });

        const orders = await Order.find({ 
            restaurantId, 
            isDownloaded: false 
        }).sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 7. CLEAR INBOX (Mark as downloaded after PDF export) ---
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });
        
        await Order.updateMany(
            { restaurantId, isDownloaded: false },
            { $set: { isDownloaded: true } }
        );

        res.status(200).json({ message: "Inbox cleared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear inbox" });
    }
});

export default router;