const Broadcast = require('../models/Broadcast');

const createBroadcast = async (req, res) => {
  try {
    const broadcastData = req.body;
    broadcastData.createdBy = req.user.id;
    
    const broadcast = new Broadcast(broadcastData);
    await broadcast.save();
    
    // Emit real-time broadcast
    if (req.app.get('io')) {
      req.app.get('io').emit('new-broadcast', broadcast);
    }
    
    res.status(201).json({
      success: true,
      broadcast
    });
    
  } catch (error) {
    console.error('Create broadcast error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const getBroadcasts = async (req, res) => {
  try {
    const { type, target, active } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (target) filter.target = target;
    if (active !== undefined) filter.isActive = active === 'true';
    
    // For super admin, show all broadcasts
    if (req.user.role !== 'super-admin') {
      filter.$or = [
        { target: 'all' },
        { target: 'owners' }
      ];
    }
    
    const broadcasts = await Broadcast.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      broadcasts
    });
    
  } catch (error) {
    console.error('Get broadcasts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const updateBroadcast = async (req, res) => {
  try {
    const broadcast = await Broadcast.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('createdBy', 'name email');
    
    if (!broadcast) {
      return res.status(404).json({ 
        success: false, 
        message: 'Broadcast not found' 
      });
    }
    
    res.json({
      success: true,
      broadcast
    });
    
  } catch (error) {
    console.error('Update broadcast error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const deleteBroadcast = async (req, res) => {
  try {
    const broadcast = await Broadcast.findByIdAndDelete(req.params.id);
    
    if (!broadcast) {
      return res.status(404).json({ 
        success: false, 
        message: 'Broadcast not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Broadcast deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete broadcast error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

module.exports = {
  createBroadcast,
  getBroadcasts,
  updateBroadcast,
  deleteBroadcast
};