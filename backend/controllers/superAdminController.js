import Owner from '../models/Owner.js';
import Order from '../models/Order.js';
import Dish from '../models/Dish.js';
import jwt from 'jsonwebtoken';

// 🚀 MASTER SYNC: Gets All Data + Calculates Health
export const getCEOStats = async (req, res) => {
    try {
        const owners = await Owner.find().sort({ createdAt: -1 }).lean();
        
        // Enrich data with Health Status based on ORDERS
        const richData = await Promise.all(owners.map(async (owner) => {
            const lastOrder = await Order.findOne({ restaurantId: owner._id }).sort({ createdAt: -1 }).lean();
            
            // 🏥 HEALTH ALGORITHM
            let health = "🔴 At Risk"; // Default: No orders ever
            let lastActive = "Never";
            
            if (lastOrder) {
                lastActive = new Date(lastOrder.createdAt).toLocaleDateString();
                const hoursSince = (new Date() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60);
                
                if (hoursSince < 24) health = "🟢 Healthy";       // Ordered today
                else if (hoursSince < 72) health = "🟡 Attention"; // Ordered recently
            }

            return { 
                ...owner, 
                health, 
                lastActive 
            };
        }));

        res.json(richData);
    } catch (error) {
        res.status(500).json({ message: "CEO Sync Failed" });
    }
};

// ⚡ KILL SWITCH TOGGLE
export const toggleFeature = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const { field, value } = req.body; // e.g., 'settings.menuActive'
        
        // Dynamic update using $set
        await Owner.findByIdAndUpdate(ownerId, { $set: { [field]: value } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Toggle Failed" }); }
};

// 📝 SAVE NOTES
export const updateNotes = async (req, res) => {
    try {
        await Owner.findByIdAndUpdate(req.params.ownerId, { ceoNotes: req.body.notes });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Save Failed" }); }
};

// 👻 GOD MODE LOGIN
export const ghostLogin = async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.ownerId);
        if (!owner) return res.status(404).json({ message: "Not Found" });
        const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.json({ success: true, token, username: owner.username });
    } catch (e) { res.status(500).json({ message: "Ghost Login Failed" }); }
};

// 📢 BROADCAST
export const sendBroadcast = async (req, res) => {
    if (req.io) {
        req.io.emit('superadmin-broadcast', { message: req.body.message, date: new Date() });
        return res.json({ success: true });
    }
    res.status(500).json({ message: "Socket Offline" });
};