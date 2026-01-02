import express from 'express';
import Owner from '../models/Owner.js'; 
import Dish from '../models/Dish.js'; 
import Order from '../models/Order.js'; 
import Settings from '../models/Settings.js'; // ✅ New Model for Maintenance
import jwt from 'jsonwebtoken'; 
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔒 MIDDLEWARE: adminOnly (CEO Srinivas Only)
const adminOnly = (req, res, next) => {
    if (req.user && req.user.username === "srinivas") {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Master Admin Only" });
    }
};

// ============================================================
// 📈 1. SAAS HEALTH & ANALYTICS (MRR & Churn)
// ============================================================

/**
 * @route   GET /api/superadmin/platform-stats
 * @desc    Calculates MRR (₹999/pro) and Churn for the CEO
 */
router.get('/platform-stats', protect, adminOnly, async (req, res) => {
    try {
        const owners = await Owner.find({}).select('isPro trialEndsAt createdAt').lean();
        
        const totalClients = owners.length;
        const proUsers = owners.filter(o => o.isPro).length;
        
        // MRR Logic: Total Pro Users x your price (₹999)
        const mrr = proUsers * 999;

        // Churn Logic: Users whose trials expired > 7 days ago and didn't upgrade
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
// 🚦 2. GLOBAL MAINTENANCE (Emergency Brake)
// ============================================================

/**
 * @route   POST /api/superadmin/toggle-maintenance
 */
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

/**
 * @route   GET /api/superadmin/maintenance-status
 * @desc    Public route for Menu/Dashboard to check if system is down
 */
router.get('/maintenance-status', async (req, res) => {
    const settings = await Settings.findOne().lean();
    res.json({ enabled: settings?.maintenanceMode || false });
});

// ============================================================
// 🚀 3. NUCLEAR PURGE & SECURITY
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
// 💵 4. CASH UPGRADE (Manual Override)
// ============================================================

/**
 * @route   PUT /api/superadmin/manual-upgrade/:id
 * @desc    Upgrades user to PRO after receiving Cash payment
 */
router.put('/manual-upgrade/:id', protect, adminOnly, async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id);
        if (!owner) return res.status(404).json({ message: "Owner not found" });

        owner.isPro = true;
        // Extend 30 days from today
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);
        owner.trialEndsAt = newExpiry;

        await owner.save();
        res.json({ success: true, message: "Cash Payment Logged. Plan Activated." });
    } catch (error) {
        res.status(500).json({ message: "Upgrade Error" });
    }
});

// Reuse your existing /all-owners and /ghost-login routes here...

export default router;