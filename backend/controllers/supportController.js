// controllers/supportController.js
import SupportTicket from "../models/SupportTicket.js";

// Create new support ticket
export const createTicket = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message required" });
    }

    const ticket = await SupportTicket.create({
      userId: req.user.id,
      role: req.user.role,
      title,
      message,
      status: "open",
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: "Failed to create ticket" });
  }
};

// Get tickets (owner / superadmin)
export const getTickets = async (req, res) => {
  try {
    const query =
      req.user.role === "superadmin"
        ? {}
        : { userId: req.user.id };

    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

// Update ticket status (superadmin)
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: "Failed to update ticket" });
  }
};
