const express = require('express');
const router = express.Router();
const { auth, isSuperAdmin } = require('../middleware/auth');
const Owner = require('../models/Owner');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const SupportTicket = require('../models/SupportTicket');

// All routes require super admin authentication
router.use(auth, isSuperAdmin);

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts
    const totalOwners = await Owner.countDocuments({ role: 'owner' });
    const totalOrders = await Order.countDocuments();
    const totalDishes = await Dish.countDocuments();
    const activeTickets = await SupportTicket.countDocuments({ 
      status: { $in: ['open', 'in-progress'] } 
    });
    
    // Get recent orders
    const recentOrders = await Order.find()
      .populate('restaurantId', 'restaurantName')
      .sort({ orderedAt: -1 })
      .limit(10);
    
    // Get revenue by restaurant
    const revenueByRestaurant = await Order.aggregate([
      {
        $group: {
          _id: '$restaurantId',
          totalRevenue: { $sum: '$finalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'owners',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      {
        $unwind: '$restaurant'
      },
      {
        $project: {
          restaurantName: '$restaurant.restaurantName',
          totalRevenue: 1,
          orderCount: 1
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalOwners,
        totalOrders,
        totalDishes,
        activeTickets
      },
      recentOrders,
      revenueByRestaurant
    });
    
  } catch (error) {
    console.error('Super admin dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get all owners
router.get('/owners', async (req, res) => {
  try {
    const owners = await Owner.find({ role: 'owner' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      owners
    });
    
  } catch (error) {
    console.error('Get owners error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update owner subscription
router.patch('/owners/:id/subscription', async (req, res) => {
  try {
    const { subscription } = req.body;
    
    const owner = await Owner.findByIdAndUpdate(
      req.params.id,
      { 
        subscription,
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      { new: true }
    ).select('-password');
    
    if (!owner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Owner not found' 
      });
    }
    
    res.json({
      success: true,
      owner
    });
    
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get system logs (placeholder)
router.get('/logs', (req, res) => {
  res.json({
    success: true,
    logs: [
      { timestamp: new Date(), action: 'System started', user: 'System' },
      { timestamp: new Date(Date.now() - 3600000), action: 'New restaurant registered', user: 'Admin' }
    ]
  });
});

module.exports = router;