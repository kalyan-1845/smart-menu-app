const Order = require('../models/Order');
const Dish = require('../models/Dish');

const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    orderData.restaurantId = req.user.id;
    
    // Calculate totals if not provided
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must have at least one item' 
      });
    }
    
    // Calculate totals if not provided
    if (!orderData.totalAmount) {
      let total = 0;
      for (const item of orderData.items) {
        if (item.dishId) {
          const dish = await Dish.findById(item.dishId);
          if (dish) {
            item.price = dish.price;
            item.total = dish.price * item.quantity;
            total += item.total;
          }
        }
      }
      orderData.totalAmount = total;
      orderData.finalAmount = total - (orderData.discount || 0);
    }
    
    const order = new Order(orderData);
    await order.save();
    
    // Populate dish details
    await order.populate('items.dishId');
    
    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('new-order', order);
    }
    
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
};

const getOrders = async (req, res) => {
  try {
    const { 
      status, 
      type, 
      date, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = { restaurantId: req.user.id };
    
    if (status) filter.status = status;
    if (type) filter.orderType = type;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.orderedAt = { $gte: startDate, $lte: endDate };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(filter)
      .populate('items.dishId')
      .sort({ orderedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(filter);
    
    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.dishId');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    // Check if user owns this order
    if (order.restaurantId.toString() !== req.user.id && req.user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
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
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, chefNotes } = req.body;
    const updateData = { status };
    
    if (chefNotes) updateData.chefNotes = chefNotes;
    
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
        if (this.startedAt) {
          updateData.actualPrepTime = now - this.startedAt;
        }
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
    
    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('order-status-update', {
        orderId: order._id,
        status: order.status,
        updatedAt: now
      });
    }
    
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
};

const getKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      restaurantId: req.user.id,
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
};

const getTodayStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const stats = await Order.aggregate([
      {
        $match: {
          restaurantId: req.user.id,
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
          readyOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'ready'] }, 1, 0] }
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
        readyOrders: 0,
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
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getKitchenOrders,
  getTodayStats
};