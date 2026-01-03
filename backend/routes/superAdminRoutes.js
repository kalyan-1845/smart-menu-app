import express from 'express';
import Owner from '../models/Owner.js'; 
import Dish from '../models/Dish.js'; 
import Order from '../models/Order.js'; 
import Settings from '../models/Settings.js'; 
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔒 MIDDLEWARE: adminOnly (CEO Logic)
const adminOnly = (req, res, next) => {
    if (req.user && req.user.username === "srinivas") {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Master Admin Only" });
    }
};

// ============================================================
// 📈 1. PLATFORM VISIBILITY
// ============================================================

router.get('/all-owners', protect, adminOnly, async (req, res) => {
    try {
        const owners = await Owner.find({}).sort({ createdAt: -1 });
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: "Network Retrieval Error" });
    }
});

router.get('/platform-stats', protect, adminOnly, async (req, res) => {
    try {
        const owners = await Owner.find({}).select('isPro trialEndsAt createdAt').lean();
        const totalClients = owners.length;
        const proUsers = owners.filter(o => o.isPro).length;
        const mrr = proUsers * 999;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const churned = owners.filter(o => !o.isPro && new Date(o.trialEndsAt) < sevenDaysAgo).length;

        res.json({
            totalClients,
            activePro: proUsers,
            mrr,
            churnRate: totalClients > 0 ? ((churned / totalClients) * 100).toFixed(1) : 0
        });
    } catch (error) {
        res.status(500).json({ message: "Analytics Node Error" });
    }
});

// ============================================================
// 🚦 2. GLOBAL MAINTENANCE & CLEANUP
// ============================================================

// ✅ EMERGENCY CLEANUP: Deletes all dishes that don't belong to a real restaurant
router.post('/cleanup-ghost-data', protect, adminOnly, async (req, res) => {
    try {
        const validOwners = await Owner.find().select('_id');
        const validIds = validOwners.map(o => o._id.toString());

        // Delete dishes with no restaurantId or test names like 'kalyanreddy1'
        const result = await Dish.deleteMany({
            $or: [
                { restaurantId: { $nin: validIds } },
                { name: { $in: ["kalyanreddy1", "akkajj", "jjanz", "kalyan"] } },
                { category: { $exists: false } }
            ]
        });

        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).json({ message: "Cleanup Failed" });
    }
});

router.post('/toggle-maintenance', protect, adminOnly, async (req, res) => {
    try {
        const { enabled } = req.body;
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();
        
        settings.maintenanceMode = enabled;
        await settings.save();
        
        res.json({ success: true, enabled: settings.maintenanceMode });
    } catch (error) {
        res.status(500).json({ message: "Maintenance Toggle Failed" });
    }
});

router.get('/maintenance-status', async (req, res) => {
    try {
        const settings = await Settings.findOne().lean();
        res.json({ enabled: settings?.maintenanceMode || false });
    } catch (e) {
        res.json({ enabled: false });
    }
});

// ============================================================
// 🚀 3. NUCLEAR PURGE
// ============================================================

router.delete('/delete-owner/:id', protect, adminOnly, async (req, res) => {
    const { id } = req.params;
    try {
        await Promise.all([
            Owner.findByIdAndDelete(id),
            Dish.deleteMany({ restaurantId: id }),
            Order.deleteMany({ restaurantId: id })
        ]);
        res.json({ success: true, message: "Restaurant wiped from cloud." });
    } catch (error) {
        res.status(500).json({ message: "Purge Error" });
    }
});

// ============================================================
// 💵 4. CASH UPGRADE
// ============================================================

router.put('/manual-upgrade/:id', protect, adminOnly, async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id);
        if (!owner) return res.status(404).json({ message: "Owner not found" });

        owner.isPro = true;
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);
        owner.trialEndsAt = newExpiry;

        await owner.save();
        res.json({ success: true, message: "Cash Payment Logged. Plan Activated." });
    } catch (error) {
        res.status(500).json({ message: "Upgrade Error" });
    }
});

export default router;