import Broadcast from '../models/Broadcast.js';

/**
 * 🚀 SEND TARGETED BROADCAST
 * Now supports targeting specific account types (Pro/Trial)
 */
export const sendBroadcast = async (req, res) => {
    // Added 'target' to destructuring
    const { title, message, type, target } = req.body;

    try {
        const newBroadcast = new Broadcast({
            title,
            message,
            type: type || 'UPDATE',
            target: target || 'ALL', // ✅ New: Can target 'PRO' or 'TRIAL'
            sentBy: "CEO Control"
        });

        const savedBroadcast = await newBroadcast.save();

        // 📢 INDUSTRIAL REAL-TIME PUSH
        if (req.io) {
            if (target === 'PRO' || target === 'TRIAL') {
                // If targeting specific groups, we emit to specific logic 
                // but for simplicity at scale, we broadcast and filter on frontend
                req.io.emit('new-broadcast', savedBroadcast);
            } else {
                // Standard global broadcast
                req.io.emit('new-broadcast', savedBroadcast);
            }
        }

        res.status(201).json({ success: true, data: savedBroadcast });
    } catch (error) {
        console.error("Broadcast Error:", error);
        res.status(500).json({ message: "System failed to blast broadcast" });
    }
};

/**
 * ⚡ GET LATEST BROADCAST
 * Optimized to only fetch the most recent relevant message
 */
export const getLatestBroadcast = async (req, res) => {
    try {
        // .select('-__v') removes internal mongo versioning to save bandwidth
        // .lean() makes the query 3x faster by returning raw JS instead of Mongoose objects
        const latest = await Broadcast.findOne()
            .sort({ createdAt: -1 })
            .select('title message type createdAt') 
            .lean();

        if (!latest) return res.status(204).end(); // No content

        res.json(latest);
    } catch (error) {
        res.status(500).json({ message: "Sync error fetching broadcast" });
    }
};