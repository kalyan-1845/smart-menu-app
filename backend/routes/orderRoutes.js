import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// ============================================================
// 1. PLACE ORDER (From Customer)
// ============================================================
router.post('/', async (req, res) => {
    try {
        const { restaurantId, tableNum, items, totalAmount } = req.body;
        
        const newOrder = new Order({
            restaurantId,
            tableNum: tableNum.toString(),
            items,
            totalAmount,
            status: "Pending" // Starts as Active/Occupied
        });

        const savedOrder = await newOrder.save();

        // 🔔 Alert Admin Panel (Turn Table Blue instantly)
        if (req.io) {
            req.io.to(restaurantId.toString()).emit('new-order', savedOrder);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(500).json({ message: "Order Failed" });
    }
});

// ============================================================
// 2. GET ACTIVE ORDERS (For Admin Dashboard)
// ============================================================
router.get('/inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "ID Required" });

        // ✅ ONLY fetch 'Pending' orders. 
        // We don't need 'Completed' ones history right now, keeping it fast.
        const orders = await Order.find({ 
            restaurantId,
            status: 'Pending' 
        });

        res.json(orders);
    } catch (e) {
        res.status(500).json({ message: "Fetch Error" });
    }
});

// ============================================================
// 3. CLEAR TABLE (When Admin clicks "Close Table")
// ============================================================
router.put('/:id/status', async (req, res) => {
    try {
        // We just flip it to 'Completed'. 
        // This removes it from the "Active" list and frees the table.
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: 'Completed' }, 
            { new: true }
        );
        
        res.json(updatedOrder);
    } catch (e) {
        res.status(500).json({ message: "Update Error" });
    }
});

export default router;