const SupportTicket = require('../models/SupportTicket');

const createTicket = async (req, res) => {
  try {
    const ticketData = req.body;
    ticketData.ownerId = req.user.id;
    
    const ticket = new SupportTicket(ticketData);
    await ticket.save();
    
    res.status(201).json({
      success: true,
      ticket
    });
    
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const getTickets = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const filter = {};
    
    // Regular users can only see their own tickets
    if (req.user.role !== 'super-admin') {
      filter.ownerId = req.user.id;
    }
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    
    const tickets = await SupportTicket.find(filter)
      .populate('ownerId', 'name email restaurantName')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      tickets
    });
    
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('ownerId', 'name email restaurantName')
      .populate('assignedTo', 'name email')
      .populate('messages.senderId', 'name email role');
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }
    
    // Check if user has access to this ticket
    if (ticket.ownerId._id.toString() !== req.user.id && req.user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.json({
      success: true,
      ticket
    });
    
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const addMessage = async (req, res) => {
  try {
    const { message, attachments } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }
    
    // Check if user has access to this ticket
    if (ticket.ownerId.toString() !== req.user.id && req.user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    ticket.messages.push({
      senderId: req.user.id,
      senderRole: req.user.role,
      message,
      attachments: attachments || []
    });
    
    // Update ticket status if it was closed
    if (ticket.status === 'closed') {
      ticket.status = 'open';
    }
    
    await ticket.save();
    
    res.json({
      success: true,
      ticket
    });
    
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }
    
    // Only super admin or assigned staff can update status
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    ticket.status = status;
    if (status === 'resolved') {
      ticket.resolvedAt = new Date();
    } else if (status === 'closed') {
      ticket.closedAt = new Date();
    }
    
    await ticket.save();
    
    res.json({
      success: true,
      ticket
    });
    
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  addMessage,
  updateTicketStatus
};