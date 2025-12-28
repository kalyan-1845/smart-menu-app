// controllers/broadcastController.js
import Broadcast from "../models/Broadcast.js";

// Create broadcast (superadmin)
export const createBroadcast = async (req, res) => {
  try {
    const { title, message, targetRole } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message required" });
    }

    const broadcast = await Broadcast.create({
      title,
      message,
      targetRole: targetRole || "all", // all | owner | chef | waiter
      createdBy: req.user.id,
    });

    res.status(201).json(broadcast);
  } catch (err) {
    res.status(500).json({ error: "Failed to create broadcast" });
  }
};

// Get broadcasts (all logged-in users)
export const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({
      $or: [
        { targetRole: "all" },
        { targetRole: req.user.role },
      ],
    }).sort({ createdAt: -1 });

    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch broadcasts" });
  }
};
