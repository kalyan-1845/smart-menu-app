import express from 'express';
import Order from '../models/Order.js'; 

const router = express.Router();

// 1. CREATE NEW ORDER (Used by Cart)
router.post('/', async (req, res) => {
  try {
    console.log("📥 Received Order Data:", req.body); 

    if (!req.body.restaurantId) {
        return res.status(400).json({ message: "Restaurant ID is missing" });
    }

    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();

    console.log("✅ Order Saved:", savedOrder._id);

    // Notify Restaurant
    if (req.io) {
        req.io.to(req.body.restaurantId).emit('new-order', savedOrder);
        req.io.to('super-admin-room').emit('global-new-order', savedOrder);
    }

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("❌ ORDER FAILED:", err.message); 
    res.status(400).json({ message: err.message });
  }
});

// 2. 🚀 TRACK SINGLE ORDER (This is the specific part you were missing!)
router.get('/track/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(order);
    } catch (err) {
        console.error("Tracking Error:", err);
        res.status(500).json({ message: "Server Error during tracking" });
    }
});

// 3. GET ALL ORDERS (Used by Restaurant Admin)
router.get('/:restaurantId', async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. UPDATE ORDER STATUS (Used by Chef/Waiter)
router.put('/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    );
    
    // Notify Tracker & Admin
    if (req.io && updatedOrder) {
        // Notify the specific customer tracking page
        req.io.emit(`order-update-${updatedOrder._id}`, updatedOrder);
        
        // Notify the restaurant dashboard
        req.io.to(updatedOrder.restaurantId).emit('order-status-updated', updatedOrder);
    }
    
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;