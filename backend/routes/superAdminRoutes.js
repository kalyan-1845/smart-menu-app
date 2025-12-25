import express from 'express';
import Owner from '../models/Owner.js'; 
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 🔒 MIDDLEWARE: adminOnly
 * Ensures that only the master admin (Srinivas) can access these routes.
 */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.username === "srinivas") {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Master Admin Only" });
    }
};

// ============================================================
// 1. DASHBOARD & STATS
// ============================================================

/**
 * @route   GET /api/superadmin/all-owners
 * @desc    Fetch all restaurants with calculated days remaining
 */
router.get('/all-owners', protect, adminOnly, async (req, res) => {
    try {
        const owners = await Owner.find({}).select('-password').sort({ createdAt: -1 });
        
        const data = owners.map(owner => {
            const diffTime = new Date(owner.trialEndsAt) - new Date();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            return { ...owner._doc, daysLeft };
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching owners" });
    }
});

/**
 * @route   GET /api/superadmin/platform-stats
 * @desc    Get total revenue, client counts, and conversion stats
 */
router.get('/platform-stats', protect, adminOnly, async (req, res) => {
    try {
        const totalClients = await Owner.countDocuments({});
        const proClients = await Owner.countDocuments({ isPro: true });
        const activeTrials = totalClients - proClients;
        
        // Potential Monthly Recurring Revenue (MRR) based on 999/mo rate
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

// ============================================================
// 2. SUBSCRIPTION & PAYMENT MANAGEMENT
// ============================================================

/**
 * @route   PUT /api/superadmin/extend/:id
 * @desc    Quick Extend: Manually add 30 days and log cash payment
 */
router.put('/extend/:id', protect, adminOnly, async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id);
        if (!owner) return res.status(404).json({ message: "Restaurant not found" });

        // If trial already expired, start from today. If not, add to existing date.
        const currentExpiry = new Date(owner.trialEndsAt) > new Date() 
            ? new Date(owner.trialEndsAt) 
            : new Date();
        
        owner.trialEndsAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
        owner.isPro = true; 

        // 📜 CREATE PAYMENT LOG
        await Payment.create({
            restaurantId: owner._id,
            restaurantName: owner.restaurantName,
            amount: 999, 
            method: 'Cash/Manual',
            monthsPaid: 1
        });

        await owner.save();
        res.json({ message: "Plan Extended & Cash Payment Logged", owner });
    } catch (error) {
        res.status(500).json({ message: "Extension Error" });
    }
});

/**
 * @route   PUT /api/superadmin/update-subscription/:id
 * @desc    Flexible update for specific months/amounts
 */
router.put('/update-subscription/:id', protect, adminOnly, async (req, res) => {
    try {
        const { isPro, addMonths, amount, method } = req.body;
        const owner = await Owner.findById(req.params.id);

        if (!owner) return res.status(404).json({ message: "Restaurant not found" });

        if (isPro !== undefined) owner.isPro = isPro;
        
        if (addMonths) {
            const currentExpiry = new Date(owner.trialEndsAt) > new Date() 
                ? new Date(owner.trialEndsAt) 
                : new Date();
            
            owner.trialEndsAt = new Date(currentExpiry.getTime() + addMonths * 30 * 24 * 60 * 60 * 1000);
            owner.isPro = true; 

            await Payment.create({
                restaurantId: owner._id,
                restaurantName: owner.restaurantName,
                amount: amount || (addMonths * 999),
                method: method || 'UPI',
                monthsPaid: addMonths
            });
        }

        await owner.save();
        res.json({ message: "Subscription Updated", owner });
    } catch (error) {
        res.status(500).json({ message: "Update Error" });
    }
});

/**
 * @route   GET /api/superadmin/payments/:id
 * @desc    Get all historical payment logs for a restaurant
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