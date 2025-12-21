import express from 'express';
import Broadcast from '../models/Broadcast.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 👑 SUPERADMIN: Send Broadcast
router.post('/send', protect, async (req, res) => {
    // Note: Use your adminOnly middleware here
    const { title, message, type } = req.body;
    try {
        const announcement = await Broadcast.create({ title, message, type, sentBy: req.user.username });
        
        // 🚀 Real-time blast using Socket.io
        const io = req.app.get('socketio');
        io.emit('new-broadcast', announcement);

        res.status(201).json(announcement);
    } catch (e) { res.status(500).json({ message: "Broadcast failed" }); }
});

export default router;