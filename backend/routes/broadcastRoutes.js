import express from 'express';
import jwt from 'jsonwebtoken';
import webpush from 'web-push'; // ✅ Added WebPush
import Owner from '../models/Owner.js';
import Order from '../models/Order.js'; 
import Settings from '../models/Settings.js'; 

const router = express.Router();

// 🔐 MASTER KEY
const MASTER_PASSWORD = "vasudevsrinivas"; 
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// --- 📲 PUSH NOTIFICATION CONFIG ---
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails('mailto:bitebox.web@gmail.com', publicKey, privateKey);
        console.log("✅ SuperAdmin: Push Notification System Ready");
    } catch (err) { console.error("❌ VAPID Config Error:", err.message); }
}

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
// 🔑 1. LOGIN
// =========================================================
router.post('/login', (req, res) => {
    if (req.body.password === MASTER_PASSWORD) {
        const token = jwt.sign({ role: 'superadmin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: "Invalid Password" });
});

// =========================================================
// 🔄 2. CEO SYNC (With REAL Revenue)
// =========================================================
router.get('/ceo-sync', protect, async (req, res) => {
    try {
        const clients = await Owner.find({}).select('-password').sort({ createdAt: -1 }).lean();
        
        // Date Logic for "Monthly" stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const detailedClients = await Promise.all(clients.map(async (c) => {
            // A. REAL TOTAL REVENUE
            const totalRev = await Order.aggregate([
                { $match: { restaurantId: c._id, status: { $ne: "Cancelled" } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]);

            // B. REAL MONTHLY REVENUE
            const monthRev = await Order.aggregate([
                { $match: { restaurantId: c._id, createdAt: { $gte: startOfMonth }, status: { $ne: "Cancelled" } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]);

            // C. ACTIVITY STATS
            const lastActiveMs = c.updatedAt ? (Date.now() - new Date(c.updatedAt)) : 0;
            const daysSinceActive = Math.floor(lastActiveMs / (1000 * 60 * 60 * 24));
            
            let health = "🟢 Healthy";
            if (c.settings && !c.settings.menuActive) health = "🔴 Suspended"; 
            else if (daysSinceActive > 7) health = "🟡 Idle"; 

            return { 
                ...c, 
                health, 
                totalRevenue: totalRev[0]?.total || 0,
                monthlyRevenue: monthRev[0]?.total || 0,
                lastActive: daysSinceActive === 0 ? "Today" : `${daysSinceActive}d ago`
            };
        }));

        res.json(detailedClients);
    } catch (error) { res.status(500).json({ message: "Sync Failed" }); }
});

// =========================================================
// 📢 3. SYSTEM BROADCAST (With Mobile Push Blast!)
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
        
        // 1. Save to Settings DB
        const settings = await Settings.getSettings();
        const oldMessage = settings.broadcastMessage;
        settings.broadcastMessage = message;
        settings.maintenanceMode = maintenance;
        await settings.save();

        // 2. 🚀 TRIGGER MOBILE PUSH BLAST (Only if message changed & is not empty)
        if (message && message !== oldMessage && publicKey && privateKey) {
            console.log("📢 Blasting Mobile Notifications...");
            const allOwners = await Owner.find({ "pushSubscriptions.0": { $exists: true } });
            
            const payload = JSON.stringify({
                title: "📢 CEO Announcement",
                body: message,
                url: "/"
            });

            allOwners.forEach(owner => {
                owner.pushSubscriptions.forEach(sub => {
                    webpush.sendNotification(sub, payload).catch(e => console.log("Push expired"));
                });
            });
        }

        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Update Failed" }); }
});

// =========================================================
// 👻 4. GHOST LOGIN
// =========================================================
router.get('/ghost-login/:id', protect, async (req, res) => {
    try {
        const user = await Owner.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, ownerId: user._id, username: user.username });
    } catch (e) { res.status(500).json({ message: "Ghost Error" }); }
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
// 📝 6. UPDATE & DELETE
// =========================================================
router.put('/client/:id', protect, async (req, res) => {
    try {
        const { restaurantName, username, phoneNumber, password } = req.body;
        const updateData = { restaurantName, username, phoneNumber };
        if (password && password.trim() !== "") updateData.password = password; 
        await Owner.findByIdAndUpdate(req.params.id, updateData);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Update Failed" }); }
});

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