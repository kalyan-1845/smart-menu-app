import Owner from '../models/Owner.js';
import Dish from '../models/Dish.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';

/**
 * 📊 1. SAAS HEALTH & MRR ANALYTICS
 * Calculates earnings and churn for the CEO dashboard.
 */
export const getPlatformStats = async (req, res) => {
    try {
        const owners = await Owner.find({}).select('isPro trialEndsAt createdAt').lean();
        
        const proUsers = owners.filter(o => o.isPro).length;
        const totalUsers = owners.length;
        
        // Churn Logic: Users with expired trials in the last 7 days who didn't upgrade
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const churned = owners.filter(o => !o.isPro && new Date(o.trialEndsAt) < weekAgo).length;

        res.json({
            totalClients: totalUsers,
            activePro: proUsers,
            mrr: proUsers * 999, // Monthly Recurring Revenue
            churnRate: totalUsers > 0 ? ((churned / totalUsers) * 100).toFixed(1) : 0
        });
    } catch (error) {
        res.status(500).json({ message: "Analytics Node Error" });
    }
};

/**
 * 🚦 2. GLOBAL MAINTENANCE TOGGLE
 * Controls the "Emergency Brake" for the entire platform.
 */
export const toggleMaintenance = async (req, res) => {
    try {
        const { enabled } = req.body;
        let settings = await Settings.findOne();
        
        if (!settings) {
            settings = new Settings({ maintenanceMode: enabled });
        } else {
            settings.maintenanceMode = enabled;
        }

        await settings.save();
        res.json({ success: true, maintenanceMode: settings.maintenanceMode });
    } catch (error) {
        res.status(500).json({ message: "Maintenance toggle failed" });
    }
};

export const getMaintenanceStatus = async (req, res) => {
    try {
        const settings = await Settings.findOne().lean();
        res.json({ enabled: settings?.maintenanceMode || false });
    } catch (e) { res.json({ enabled: false }); }
};

/**
 * 💵 3. MANUAL SUBSCRIPTION (Cash Payment Override)
 * Manually upgrades a user after receiving cash.
 */
export const manualUpgrade = async (req, res) => {
    try {
        const { id } = req.params;
        const owner = await Owner.findById(id);
        if (!owner) return res.status(404).json({ message: "Owner not found" });

        // Set to Pro and extend by 30 days from today
        owner.isPro = true;
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);
        owner.trialEndsAt = newExpiry;

        await owner.save();
        res.json({ success: true, message: "Manual Cash Payment Recorded. Account Pro." });
    } catch (error) {
        res.status(500).json({ message: "Upgrade failed" });
    }
};

/**
 * 🔥 4. NUCLEAR PURGE
 * Wipes a restaurant and all its history from the cloud.
 */
export const deleteOwnerPermanently = async (req, res) => {
    try {
        const { id } = req.params;
        await Promise.all([
            Owner.findByIdAndDelete(id),
            Dish.deleteMany({ restaurantId: id }),
            Order.deleteMany({ restaurantId: id })
        ]);
        res.json({ success: true, message: "Purged forever." });
    } catch (error) {
        res.status(500).json({ message: "Purge Error" });
    }
};