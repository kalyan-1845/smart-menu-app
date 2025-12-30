const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { status, type, date } = req.query;
    let filter = {};
    
    if (status) filter.status = status;
    if (type) filter.orderType = type;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.orderedAt = { $gte: startDate, $lte: endDate };
    }
    
    const orders = await Order.find(filter)
      .populate('items.dishId')
      .sort({ orderedAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      count: orders.length,
      orders
    });
    
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.dishId');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    res.json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    
    // Emit socket event for real-time update
    req.app.get('io').emit('new-order', order);
    
    res.status(201).json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, chefNotes } = req.body;
    const updateData = { status };
    
    if (chefNotes) updateData.chefNotes = chefNotes;
    
    // Set timestamps based on status
    const now = new Date();
    switch(status) {
      case 'confirmed':
        updateData.confirmedAt = now;
        break;
      case 'preparing':
        updateData.startedAt = now;
        break;
      case 'ready':
        updateData.readyAt = now;
        updateData.actualPrepTime = now - this.startedAt;
        break;
      case 'completed':
        updateData.completedAt = now;
        break;
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('items.dishId');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    // Emit socket event for real-time update
    req.app.get('io').emit('order-status-update', {
      orderId: order._id,
      status: order.status,
      updatedAt: now
    });
    
    res.json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get kitchen orders (for chef dashboard)
router.get('/kitchen/pending', async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ['pending', 'confirmed', 'preparing'] } 
    })
    .populate('items.dishId')
    .sort({ orderedAt: 1 })
    .limit(50);
    
    res.json({
      success: true,
      orders
    });
    
  } catch (error) {
    console.error('Kitchen orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get today's statistics
router.get('/stats/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const stats = await Order.aggregate([
      {
        $match: {
          orderedAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed']] }, 1, 0] }
          },
          preparingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'preparing'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        preparingOrders: 0,
        completedOrders: 0
      }
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;