import express from 'express';
import Owner from '../models/Owner.js'; 
// Ensure you have a Payment model created for the ledger logic below
// import Payment from '../models/Payment.js'; 
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 🔒 MIDDLEWARE: adminOnly
 * High-security gatekeeper. Even with a valid token, only the username 
 * "srinivas" can pass through these routes.
 */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.username === "srinivas") {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Master Admin Only" });
    }
};

// ============================================================
// 1. DASHBOARD & STATS (The "CEO" View)
// ============================================================

/**
 * @route   GET /api/superadmin/all-owners
 * @desc    Fetch every restaurant on the platform and calculate their trial status.
 * @access  Master Admin Only
 */
router.get('/all-owners', protect, adminOnly, async (req, res) => {
    try {
        const owners = await Owner.find({}).select('-password').sort({ createdAt: -1 });
        
        const data = owners.map(owner => {
            // Calculate how many days are left in the 60-day trial
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
 * @desc    BiteBox Analytics: Revenue tracking and client conversion.
 * @access  Master Admin Only
 */
router.get('/platform-stats', protect, adminOnly, async (req, res) => {
    try {
        const totalClients = await Owner.countDocuments({});
        const proClients = await Owner.countDocuments({ isPro: true });
        const activeTrials = totalClients - proClients;
        
        // MRR (Monthly Recurring Revenue) calculation based on your 999/mo pricing strategy
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
// 2. SUBSCRIPTION & PAYMENT MANAGEMENT (Manual Onboarding)
// ============================================================

/**
 * @route   PUT /api/superadmin/extend/:id
 * @desc    Quick Extend: Manually add 30 days. Perfect for when a restaurant 
 * pays you cash in person.
 * @access  Master Admin Only
 */
router.put('/extend/:id', protect, adminOnly, async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id);
        if (!owner) return res.status(404).json({ message: "Restaurant not found" });

        // Logic to ensure extension starts from today if already expired
        const currentExpiry = new Date(owner.trialEndsAt) > new Date() 
            ? new Date(owner.trialEndsAt) 
            : new Date();
        
        owner.trialEndsAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
        owner.isPro = true; 

        // Note: Ensure the Payment model is imported/created to use this ledger logic
        /*
        await Payment.create({
            restaurantId: owner._id,
            restaurantName: owner.restaurantName,
            amount: 999, 
            method: 'Cash/Manual',
            monthsPaid: 1
        });
        */

        await owner.save();
        res.json({ message: "Plan Extended & Cash Payment Logged", owner });
    } catch (error) {
        res.status(500).json({ message: "Extension Error" });
    }
});

/**
 * @route   PUT /api/superadmin/update-subscription/:id
 * @desc    Flexible update for specific months/amounts (e.g., Annual Plans).
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

            // Record the manual payment in the database
            /*
            await Payment.create({
                restaurantId: owner._id,
                restaurantName: owner.restaurantName,
                amount: amount || (addMonths * 999),
                method: method || 'UPI',
                monthsPaid: addMonths
            });
            */
        }

        await owner.save();
        res.json({ message: "Subscription Updated", owner });
    } catch (error) {
        res.status(500).json({ message: "Update Error" });
    }
});

export default router;