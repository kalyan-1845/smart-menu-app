import express from 'express';
import mongoose from 'mongoose'; 
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

// ==========================================
// 1. PLACE ORDER (Customer Action)
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { customerName, items, totalAmount, paymentMethod, tableNum, restaurantId, owner, status } = req.body;
        
        // Handle "username" vs "ObjectId" automatically
        let finalId = restaurantId || owner;
        if (!mongoose.Types.ObjectId.isValid(finalId)) {
            const user = await Owner.findOne({ username: finalId });
            if (user) finalId = user._id;
            else return res.status(404).json({ message: "Restaurant not found" });
        }

        const newOrder = new Order({ 
            customerName, 
            tableNum, 
            restaurantId: finalId, 
            items, 
            totalAmount, 
            paymentMethod, 
            status: status || "Pending", 
            isDownloaded: false // Kept for database consistency, even if Inbox is hidden
        });

        const savedOrder = await newOrder.save();

        // Notify Restaurant (Chef/Admin) via Socket
        if (req.io) {
            req.io.to(finalId.toString()).emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ==========================================
// 2. UPDATE STATUS (Chef Action - Served/Cooking)
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );
        
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Revenue Logic: Add to Total Revenue only when "Served"
        if (req.body.status === "Served") {
            await Owner.findByIdAndUpdate(order.restaurantId, { 
                $inc: { totalRevenue: order.totalAmount } 
            });
        }

        // Notify Client/Tracker
        if (req.io) {
             req.io.to(order.restaurantId.toString()).emit('order-updated', order);
             req.io.emit('order-updated', order);
        }

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ==========================================
// 3. CALL WAITER
// ==========================================
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body; 
        
        const newCall = await Call.create({ 
            restaurantId, 
            tableNumber, 
            type: type || 'help' 
        });
        
        if (req.io) {
            req.io.to(restaurantId.toString()).emit('new-waiter-call', newCall);
        }
        
        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// 4. GET SINGLE ORDER (General Lookup)
// ==========================================
// Kept at the bottom to prevent route collisions
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Not found" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;