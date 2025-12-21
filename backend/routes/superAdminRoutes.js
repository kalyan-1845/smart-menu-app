import express from 'express';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 🔒 MIDDLEWARE: adminOnly
 * Ensures that only the master admin (Srinivas) can access these routes.
 */
const adminOnly = (req, res, next) => {
    // We check the username from the protected req.user object
    if (req.user && req.user.username === "srinivas") {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Master Admin Only" });
    }
};

/**
 * @route   GET /api/auth/admin/platform-stats
 * @desc    Get total revenue, client counts, and conversion stats
 */
router.get('/platform-stats', protect, adminOnly, async (req, res) => {
    try {
        const totalClients = await User.countDocuments({ role: 'OWNER' });
        const proClients = await User.countDocuments({ role: 'OWNER', isPro: true });
        const activeTrials = totalClients - proClients;
        
        // Potential Monthly Recurring Revenue (MRR)
        const monthlyRecurringRevenue = proClients * 999;

        res.json({
            totalClients,
            proClients,
            activeTrials,
            mrr: monthlyRecurringRevenue
        });
    } catch (error) {
        res.status(500).json({ message: "Analytics Node Error", error: error.message });
    }
});

/**
 * @route   PUT /api/auth/admin/update-subscription/:id
 * @desc    Renew subscription, add months, and log the payment
 */

router.put('/update-subscription/:id', protect, adminOnly, async (req, res) => {
    try {
        const { isPro, addMonths, amount, method } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: "Restaurant Owner not found" });

        // Update Pro Status if provided
        if (isPro !== undefined) user.isPro = isPro;
        
        // Update Expiry Date if months are added
        if (addMonths) {
            // If trial already expired, start from today. If not, add to existing date.
            const currentExpiry = new Date(user.trialEndsAt) > new Date() 
                ? new Date(user.trialEndsAt) 
                : new Date();
            
            user.trialEndsAt = new Date(currentExpiry.getTime() + addMonths * 30 * 24 * 60 * 60 * 1000);
            user.isPro = true; // Automatically make Pro if they pay for months

            // 📜 CREATE PAYMENT LOG
            await Payment.create({
                restaurantId: user._id,
                restaurantName: user.restaurantName,
                amount: amount || (addMonths * 999), // Fallback to standard rate
                method: method || 'UPI',
                monthsPaid: addMonths
            });
        }

        await user.save();
        res.json({ message: "Registry Updated & Payment Logged", user });
    } catch (error) {
        res.status(500).json({ message: "Subscription Update Error" });
    }
});

/**
 * @route   GET /api/auth/admin/payments/:id
 * @desc    Get all historical payment logs for a specific restaurant
 */
router.get('/payments/:id', protect, adminOnly, async (req, res) => {
    try {
        const history = await Payment.find({ restaurantId: req.params.id }).sort({ paidAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Ledger Retrieval Error" });
    }
});

export default router;