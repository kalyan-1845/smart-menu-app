const Notification = require('../models/Notification');

// Create a notification model first
const notificationSchema = new require('mongoose').Schema({
  userId: {
    type: require('mongoose').Schema.Types.ObjectId,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'system', 'alert', 'info'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  data: Object,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const NotificationModel = require('mongoose').model('Notification', notificationSchema);

const getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      notifications
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    await NotificationModel.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await NotificationModel.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
    
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification
};