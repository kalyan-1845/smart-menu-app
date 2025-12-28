import Broadcast from '../models/Broadcast.js';

export const sendBroadcast = async (req, res) => {
    const { title, message, type } = req.body;

    try {
        const newBroadcast = new Broadcast({
            title,
            message,
            type,
            sentBy: "Super Admin"
        });

        const savedBroadcast = await newBroadcast.save();

        // 📢 Real-time push to every connected dashboard
        if (req.io) {
            req.io.emit('new-broadcast', savedBroadcast);
        }

        res.status(201).json(savedBroadcast);
    } catch (error) {
        res.status(500).json({ message: "Failed to send broadcast" });
    }
};

export const getLatestBroadcast = async (req, res) => {
    try {
        const latest = await Broadcast.findOne().sort({ createdAt: -1 });
        res.json(latest);
    } catch (error) {
        res.status(500).json({ message: "Error fetching broadcast" });
    }
};