import express from 'express';
import SupportTicket from '../models/SupportTicket.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 📩 OWNER: Create a new ticket or add a message
router.post('/create', protect, async (req, res) => {
    const { subject, message } = req.body;
    try {
        const ticket = await SupportTicket.create({
            restaurantId: req.user.id,
            restaurantName: req.user.restaurantName,
            subject,
            messages: [{ sender: 'OWNER', text: message }]
        });
        res.status(201).json(ticket);
    } catch (e) { res.status(500).json({ message: "Failed to send ticket" }); }
});

// 👑 SUPERADMIN: Get all open tickets
router.get('/all', protect, async (req, res) => {
    // Note: Add your adminOnly middleware here
    const tickets = await SupportTicket.find().sort({ updatedAt: -1 });
    res.json(tickets);
});

// ✍️ REPLY: Add a reply to a ticket
router.put('/reply/:id', protect, async (req, res) => {
    const { text, sender } = req.body; // sender: 'SUPERADMIN' or 'OWNER'
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        ticket.messages.push({ sender, text });
        if (sender === 'SUPERADMIN' && ticket.status === 'RESOLVED') ticket.status = 'OPEN';
        await ticket.save();
        res.json(ticket);
    } catch (e) { res.status(500).json({ message: "Reply failed" }); }
});

export default router;