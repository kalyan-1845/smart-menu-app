import express from 'express';
import webpush from 'web-push'; // Required for global mobile alerts
import Broadcast from '../models/Broadcast.js';
import Owner from '../models/Owner.js'; 
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- 🔑 WEB PUSH CONFIG ---
webpush.setVapidDetails(
    'mailto:support@bitebox.com',
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

/**
 * 🔒 MIDDLEWARE: adminOnly
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
 * @desc    Create an announcement and blast it via Socket AND Mobile Push
 * @access  Private (SuperAdmin Only)
 */
router.post('/send', protect, adminOnly, async (req, res) => {
    const { title, message, type } = req.body;

    try {
        // 1. Save to Database
        const announcement = await Broadcast.create({ 
            title, 
            message, 
            type: type || 'UPDATE', 
            sentBy: req.user.username 
        });
        
        // 2. 🚀 Real-time blast for Laptop users (Socket.io)
        if (req.io) {
            req.io.emit('global-broadcast', announcement);
        }

        // 3. 📱 MOBILE PUSH BLAST: Notify all restaurants in the system
        try {
            const allOwners = await Owner.find({ "pushSubscriptions.0": { $exists: true } });
            
            const payload = JSON.stringify({
                title: `📢 ${title}`,
                body: message,
                url: `/` 
            });

            allOwners.forEach(owner => {
                owner.pushSubscriptions.forEach(sub => {
                    webpush.sendNotification(sub, payload).catch(() => {});
                });
            });
        } catch (pushErr) {
            console.error("Global Push Failed:", pushErr);
        }

        res.status(201).json(announcement);
    } catch (error) {
        console.error("Broadcast Error:", error);
        res.status(500).json({ message: "Broadcast failed to send" });
    }
});

/**
 * @route   GET /api/broadcast/latest
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