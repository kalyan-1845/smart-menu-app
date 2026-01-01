import express from 'express';
import webpush from 'web-push'; // Required for global mobile alerts
import Broadcast from '../models/Broadcast.js';
import Owner from '../models/Owner.js'; 
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- 🔑 SAFE WEB PUSH CONFIG (FIXED) ---
// 1. Use CORRECT names matching your .env
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

// 2. ONLY initialize if keys exist
if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails(
            'mailto:support@bitebox.com',
            publicKey,
            privateKey
        );
        console.log("✅ Broadcast Routes: Push Initialized");
    } catch (err) {
        console.error("❌ Broadcast Routes VAPID Error:", err.message);
    }
} else {
    console.warn("⚠️ Broadcast Routes: Skipping VAPID (Keys missing)");
}

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
        // Safe check for keys before sending
        if (publicKey && privateKey) {
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