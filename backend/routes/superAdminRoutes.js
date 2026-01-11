import express from 'express';
import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';
import Order from '../models/Order.js'; 
import Settings from '../models/Settings.js'; 

const router = express.Router();

// 🔐 MASTER KEY
const MASTER_PASSWORD = "vasudevsrinivas"; 
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// --- MIDDLEWARE ---
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No Token" });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'superadmin') throw new Error();
        next();
    } catch (e) { res.status(401).json({ message: "Invalid Token" }); }
};

// =========================================================
// 🔑 1. LOGIN (Required for Frontend)
// =========================================================
router.post('/login', (req, res) => {
    if (req.body.password === MASTER_PASSWORD) {
        const token = jwt.sign({ role: 'superadmin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: "Invalid Password" });
});

// =========================================================
// 🔄 2. CEO SYNC (Real Revenue & Activity Stats)
// =========================================================
router.get('/ceo-sync', protect, async (req, res) => {
    try {
        const clients = await Owner.find({}).select('-password').sort({ createdAt: -1 }).lean();
        
        // Date Logic for "Monthly" stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const detailedClients = await Promise.all(clients.map(async (c) => {
            // A. REAL TOTAL REVENUE (All time, non-cancelled orders)
            const totalRev = await Order.aggregate([
                { $match: { restaurantId: c._id, status: { $ne: "Cancelled" } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]);

            // B. REAL MONTHLY REVENUE (Since 1st of this month)
            const monthRev = await Order.aggregate([
                { $match: { restaurantId: c._id, createdAt: { $gte: startOfMonth }, status: { $ne: "Cancelled" } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]);

            // C. ACTIVITY STATS
            const lastActiveMs = c.updatedAt ? (Date.now() - new Date(c.updatedAt)) : 0;
            const daysSinceActive = Math.floor(lastActiveMs / (1000 * 60 * 60 * 24));
            
            let health = "🟢 Healthy";
            if (c.settings && !c.settings.menuActive) health = "🔴 Suspended"; // Kill switch active
            else if (daysSinceActive > 7) health = "🟡 Idle"; // No updates for 7 days

            return { 
                ...c, 
                health, 
                totalRevenue: totalRev[0]?.total || 0,
                monthlyRevenue: monthRev[0]?.total || 0,
                daysActive: daysSinceActive,
                lastActiveStr: daysSinceActive === 0 ? "Today" : `${daysSinceActive}d ago`
            };
        }));

        res.json(detailedClients);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: "Sync Failed" }); 
    }
});

// =========================================================
// 🌍 3. SYSTEM BROADCAST & MAINTENANCE
// =========================================================
router.get('/system-status', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({ message: settings.broadcastMessage || "", maintenance: settings.maintenanceMode || false });
    } catch (e) { res.json({ message: "", maintenance: false }); }
});

router.put('/system-status', protect, async (req, res) => {
    try {
        const { message, maintenance } = req.body;
        const settings = await Settings.getSettings();
        settings.broadcastMessage = message;
        settings.maintenanceMode = maintenance;
        await settings.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Update Failed" }); }
});

// =========================================================
// 👻 4. GHOST LOGIN (God Mode)
// =========================================================
router.get('/ghost-login/:id', protect, async (req, res) => {
    try {
        const user = await Owner.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        // Generate a valid token for THIS user
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, ownerId: user._id, username: user.username });
    } catch (e) { res.status(500).json({ message: "Ghost Protocol Error" }); }
});

// =========================================================
// 💀 5. KILL SWITCH & CONTROLS
// =========================================================
router.put('/control/:id', protect, async (req, res) => {
    try {
        const { field, value } = req.body;
        await Owner.findByIdAndUpdate(req.params.id, { $set: { [field]: value } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Switch Failed" }); }
});

// =========================================================
// 📝 6. UPDATE CLIENT (Password Reset etc)
// =========================================================
router.put('/client/:id', protect, async (req, res) => {
    try {
        const { restaurantName, username, phoneNumber, password } = req.body;
        const updateData = { restaurantName, username, phoneNumber };
        // Only hash/update password if provided
        if (password && password.trim() !== "") updateData.password = password; 
        await Owner.findByIdAndUpdate(req.params.id, updateData);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Update Failed" }); }
});

// =========================================================
// 🗑️ 7. DELETE & RESET DATA
// =========================================================
router.delete('/client/:id', protect, async (req, res) => {
    await Owner.findByIdAndDelete(req.params.id);
    await Order.deleteMany({ restaurantId: req.params.id });
    res.json({ success: true });
});

router.post('/client/:id/reset', protect, async (req, res) => {
    await Order.deleteMany({ restaurantId: req.params.id });
    res.json({ success: true });
});

router.put('/notes/:id', protect, async (req, res) => {
    await Owner.findByIdAndUpdate(req.params.id, { ceoNotes: req.body.notes });
    res.json({ success: true });
});

export default router;