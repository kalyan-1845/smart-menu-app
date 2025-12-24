import express from 'express';
import Broadcast from '../models/Broadcast.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 🔒 MIDDLEWARE: adminOnly
 * Ensures only the master admin (Srinivas) can send global alerts.
 */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.username === "srinivas") {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Master Admin Only" });
    }
};

/**
 * @route   POST /api/broadcast/send
 * @desc    Create an announcement and blast it to all connected restaurants via Socket.io
 * @access  Private (SuperAdmin Only)
 */
router.post('/send', protect, adminOnly, async (req, res) => {
    const { title, message, type } = req.body;

    try {
        // 1. Save to Database for history and for users logging in later
        const announcement = await Broadcast.create({ 
            title, 
            message, 
            type: type || 'UPDATE', 
            sentBy: req.user.username 
        });
        
        // 2. 🚀 Real-time blast using Socket.io
        // We use req.io which was attached in your server.js middleware
        if (req.io) {
            req.io.emit('new-broadcast', announcement);
        }

        res.status(201).json(announcement);
    } catch (error) {
        console.error("Broadcast Error:", error);
        res.status(500).json({ message: "Broadcast failed to send" });
    }
});

/**
 * @route   GET /api/broadcast/latest
 * @desc    Fetch the most recent announcement for the dashboard
 * @access  Public (Authenticated Owners)
 */
router.get('/latest', protect, async (req, res) => {
    try {
        const latest = await Broadcast.findOne().sort({ createdAt: -1 });
        res.json(latest);
    } catch (error) {
        res.status(500).json({ message: "Error fetching announcement" });
    }
});

export default router;