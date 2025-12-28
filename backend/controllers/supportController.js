import SupportTicket from '../models/SupportTicket.js';

// @desc    Create a new support ticket (Owner Side)
export const createTicket = async (req, res) => {
    const { subject, message, restaurantName } = req.body;
    try {
        const ticket = new SupportTicket({
            restaurantId: req.user._id,
            restaurantName,
            subject,
            messages: [{ sender: 'OWNER', text: message }]
        });
        await ticket.save();
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: "Failed to create ticket" });
    }
};

// @desc    Get all tickets (Super Admin Side)
export const getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tickets" });
    }
};

// @desc    Add a reply to a ticket
export const replyToTicket = async (req, res) => {
    const { text, sender } = req.body; // sender: 'OWNER' or 'SUPERADMIN'
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        ticket.messages.push({ sender, text });
        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: "Reply failed" });
    }
};