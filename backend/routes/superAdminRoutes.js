import express from 'express';
import Owner from '../models/Owner.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // 🚨 Added for Ghost Mode token generation
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
 */
router.get('/platform-stats', protect, adminOnly, async (req, res) => {
    try {
        const totalClients = await Owner.countDocuments({});
        const proClients = await Owner.countDocuments({ isPro: true });
        const activeTrials = totalClients - proClients;
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
// 🚀 NEW: 2. KILL SWITCH & SECURITY (God Mode)
// ============================================================

/**
 * @route   GET /api/superadmin/ghost-login/:id
 * @desc    👻 GHOST MODE: Generate a login token for any owner.
 * @access  Master Admin Only
 */
router.get('/ghost-login/:id', protect, adminOnly, async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id);
        if (!owner) return res.status(404).json({ message: "Owner not found" });

        // Generate a standard JWT token for this specific owner
        const token = jwt.sign(
            { id: owner._id, username: owner.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // Token lasts for 1 hour
        );

        res.json({
            success: true,
            token,
            username: owner.username,
            restaurantName: owner.restaurantName
        });
    } catch (error) {
        res.status(500).json({ message: "Ghost Login Failed" });
    }
});

/**
 * @route   PUT /api/superadmin/toggle-status/:id
 * @desc    🔴 KILL SWITCH: Deactivate public menu URL but keep data safe.
 * @access  Master Admin Only
 */
router.put('/toggle-status/:id', protect, adminOnly, async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id);
        if (!owner) return res.status(404).json({ message: "Restaurant not found" });

        owner.status = owner.status === 'active' ? 'suspended' : 'active';
        
        await owner.save();
        res.json({ 
            success: true, 
            newStatus: owner.status, 
            message: `Restaurant is now ${owner.status}` 
        });
    } catch (error) {
        res.status(500).json({ message: "Kill Switch Error" });
    }
});

/**
 * @route   PUT /api/superadmin/reset-password/:id
 * @desc    🔑 MASTER RESET: Change any owner password without knowing the old one.
 * @access  Master Admin Only
 */
router.put('/reset-password/:id', protect, adminOnly, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ message: "Valid new password required" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const updatedOwner = await Owner.findByIdAndUpdate(
            req.params.id,
            { password: hashedPassword },
            { new: true }
        );

        if (!updatedOwner) return res.status(404).json({ message: "Restaurant not found" });

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Master Reset Error" });
    }
});

// ============================================================
// 3. SUBSCRIPTION & PAYMENT MANAGEMENT (Manual Onboarding)
// ============================================================

/**
 * @route   PUT /api/superadmin/extend/:id
 */
router.put('/extend/:id', protect, adminOnly, async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id);
        if (!owner) return res.status(404).json({ message: "Restaurant not found" });

        const currentExpiry = new Date(owner.trialEndsAt) > new Date() 
            ? new Date(owner.trialEndsAt) 
            : new Date();
        
        owner.trialEndsAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
        owner.isPro = true; 

        await owner.save();
        res.json({ message: "Plan Extended", owner });
    } catch (error) {
        res.status(500).json({ message: "Extension Error" });
    }
});

/**
 * @route   PUT /api/superadmin/update-subscription/:id
 */
router.put('/update-subscription/:id', protect, adminOnly, async (req, res) => {
    try {
        const { isPro, addMonths } = req.body;
        const owner = await Owner.findById(req.params.id);

        if (!owner) return res.status(404).json({ message: "Restaurant not found" });

        if (isPro !== undefined) owner.isPro = isPro;
        
        if (addMonths) {
            const currentExpiry = new Date(owner.trialEndsAt) > new Date() 
                ? new Date(owner.trialEndsAt) 
                : new Date();
            
            owner.trialEndsAt = new Date(currentExpiry.getTime() + addMonths * 30 * 24 * 60 * 60 * 1000);
            owner.isPro = true; 
        }

        await owner.save();
        res.json({ message: "Subscription Updated", owner });
    } catch (error) {
        res.status(500).json({ message: "Update Error" });
    }
});

export default router;