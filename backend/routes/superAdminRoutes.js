import express from 'express';
import jwt from 'jsonwebtoken';
import webpush from 'web-push'; 
import mongoose from 'mongoose';
import os from 'os'; 
import bcrypt from 'bcryptjs'; // ✅ Needed for manual hashing
import Owner from '../models/Owner.js';
import Order from '../models/Order.js'; 
import Settings from '../models/Settings.js'; 

const router = express.Router();

// 🔐 MASTER KEY
const MASTER_PASSWORD = "vasudevsrinivas"; 
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// --- 📲 PUSH CONFIG ---
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
if (publicKey && privateKey) {
    try { webpush.setVapidDetails('mailto:bitebox.web@gmail.com', publicKey, privateKey); } 
    catch (err) { console.error("VAPID Error:", err.message); }
}

// =========================================================
// 🌍 PUBLIC ROUTES
// =========================================================

// 1. MAINTENANCE STATUS
router.get('/maintenance-status', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({ enabled: settings.maintenanceMode || false });
    } catch (e) { res.json({ enabled: false }); }
});

// 2. SERVER PULSE
router.get('/server-pulse', async (req, res) => {
    try {
        const uptime = os.uptime();
        const dbStatus = (global.mongoose && global.mongoose.connection.readyState === 1) ? "Connected" : "Unknown"; 
        const memory = process.memoryUsage().heapUsed / 1024 / 1024;
        res.json({ 
            uptime: `${Math.floor(uptime / 3600)}h`, 
            dbStatus, 
            memory: `${Math.round(memory)}MB` 
        });
    } catch (e) { res.json({ uptime: "0h", dbStatus: "Error", memory: "0MB" }); }
});

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
// 🔒 PROTECTED ROUTES
// =========================================================

// 3. LOGIN
router.post('/login', (req, res) => {
    if (req.body.password === MASTER_PASSWORD) {
        const token = jwt.sign({ role: 'superadmin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: "Invalid Password" });
});

// 4. CEO SYNC (With Revenue, Ratings & Phone)
router.get('/ceo-sync', protect, async (req, res) => {
    try {
        const clients = await Owner.find({}).select('-password').sort({ createdAt: -1 }).lean();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const detailedClients = await Promise.all(clients.map(async (c) => {
            const totalRev = await Order.aggregate([
                { $match: { restaurantId: c._id, status: { $ne: "Cancelled" } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]);
            const monthRev = await Order.aggregate([
                { $match: { restaurantId: c._id, createdAt: { $gte: startOfMonth }, status: { $ne: "Cancelled" } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]);
            
            // ⭐ Calc Average Rating
            const ratingStats = await Order.aggregate([
                { $match: { restaurantId: c._id, rating: { $exists: true } } },
                { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
            ]);

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
                rating: ratingStats[0]?.avg?.toFixed(1) || "N/A",
                reviewCount: ratingStats[0]?.count || 0,
                phoneNumber: c.phoneNumber || "", 
                lastActiveStr: daysSinceActive === 0 ? "Today" : `${daysSinceActive}d ago`
            };
        }));
        res.json(detailedClients);
    } catch (error) { res.status(500).json({ message: "Sync Failed" }); }
});

// 5. REVIEWS FEED
router.get('/reviews', protect, async (req, res) => {
    try {
        const reviews = await Order.find({ rating: { $exists: true, $ne: null } })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const ownerIds = [...new Set(reviews.map(r => r.restaurantId))];
        const owners = await Owner.find({ _id: { $in: ownerIds } }).select('restaurantName');
        const ownerMap = {};
        owners.forEach(o => ownerMap[o._id.toString()] = o.restaurantName);

        const processed = reviews.map(r => ({
            _id: r._id,
            restaurantName: ownerMap[r.restaurantId.toString()] || "Unknown",
            rating: r.rating,
            feedback: r.feedback || r.review || "No comment", 
            date: r.createdAt
        }));

        res.json(processed);
    } catch (e) { res.status(500).json({ message: "Reviews Failed" }); }
});

// 6. SYSTEM BROADCAST
router.get('/system-status', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({ 
            message: settings.broadcastMessage || "", 
            maintenance: settings.maintenanceMode || false,
            globalBanner: settings.globalBanner || ""
        });
    } catch (e) { res.json({ message: "", maintenance: false }); }
});

router.put('/system-status', protect, async (req, res) => {
    try {
        const { message, maintenance, globalBanner } = req.body;
        const settings = await Settings.getSettings();
        const oldMessage = settings.broadcastMessage;
        
        settings.broadcastMessage = message;
        settings.maintenanceMode = maintenance;
        settings.globalBanner = globalBanner; 
        await settings.save();

        if (message && message !== oldMessage && publicKey && privateKey) {
            const allOwners = await Owner.find({ "pushSubscriptions.0": { $exists: true } });
            const payload = JSON.stringify({ title: "📢 CEO Announcement", body: message, url: "/" });
            allOwners.forEach(owner => {
                owner.pushSubscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(e => {}));
            });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Update Failed" }); }
});

// 7. TIME WARP
router.put('/client/:id/extend', protect, async (req, res) => {
    try {
        const { days } = req.body;
        const user = await Owner.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        let baseDate = new Date(user.trialEndsAt);
        if (isNaN(baseDate)) baseDate = new Date(); // Fix invalid date
        if (baseDate < new Date()) baseDate = new Date(); 

        const newExpiry = new Date(baseDate.getTime() + (parseInt(days) * 24 * 60 * 60 * 1000));
        
        if (days < -100) {
             const yesterday = new Date();
             yesterday.setDate(yesterday.getDate() - 1);
             user.trialEndsAt = yesterday;
        } else {
             user.trialEndsAt = newExpiry;
        }
        user.isPro = user.trialEndsAt > new Date();
        await user.save();
        res.json({ success: true, trialEndsAt: user.trialEndsAt, isPro: user.isPro });
    } catch (e) { res.status(500).json({ message: "Time Warp Failed" }); }
});

// 8. CRUD & CONTROLS
router.get('/ghost-login/:id', protect, async (req, res) => {
    const user = await Owner.findById(req.params.id);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Use Owner Secret
    res.json({ token, ownerId: user._id, username: user.username });
});

router.put('/control/:id', protect, async (req, res) => {
    // ✅ Fix: Handle nested updates correctly (e.g. "settings.menuActive")
    const update = {};
    update[req.body.field] = req.body.value;
    await Owner.findByIdAndUpdate(req.params.id, { $set: update });
    res.json({ success: true });
});

router.put('/client/:id', protect, async (req, res) => {
    try {
        const { password, ...data } = req.body;
        
        // ✅ Fix: Manually hash password because findByIdAndUpdate skips hooks
        if (password) {
            const salt = await bcrypt.genSalt(10);
            data.password = await bcrypt.hash(password, salt);
        }

        await Owner.findByIdAndUpdate(req.params.id, data);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
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