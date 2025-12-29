import express from 'express';
import bcrypt from 'bcryptjs';
import Owner from '../models/Owner.js'; 
import Order from '../models/Order.js'; 
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔒 SECURITY: Allow "srinivas" and "superadmin"
const adminOnly = (req, res, next) => {
    if (
        (req.user && req.user.username === "srinivas") || 
        (req.user && req.user.role === "superadmin")
    ) {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Master Admin Only" });
    }
};

// ============================================================
// 🟢 1. GET ALL RESTAURANTS (REAL DATABASE VIEW)
// ============================================================

router.get('/restaurants', protect, adminOnly, async (req, res) => {
    try {
        console.log("------------------------------------------------");
        console.log("📥 CEO DASHBOARD: Fetching All Restaurants...");

        // 1. FETCH EVERYTHING (No Filters)
        // We do not hide 'superadmin' anymore. We want to see EVERYTHING in the DB.
        const owners = await Owner.find({}).select('-password').sort({ createdAt: -1 });

        // 🔍 DEBUG LOG: Print what we found to the terminal
        const namesFound = owners.map(o => o.restaurantName || o.username).join(", ");
        console.log(`✅ DATABASE FOUND (${owners.length}): ${namesFound}`);

        if (owners.length === 0) {
            console.log("⚠️ WARNING: Database returned 0 users. Is the collection empty?");
        }

        // 2. ATTACH REVENUE & DETAILS
        const data = await Promise.all(owners.map(async (owner) => {
            
            // Calculate Days Left
            let daysLeft = 0;
            if (owner.trialEndsAt) {
                const diffTime = new Date(owner.trialEndsAt) - new Date();
                daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            // Calculate Revenue (Safe Mode)
            let revenue = 0;
            try {
                // Only run aggregation if Order model is loaded
                if (Order && Order.aggregate) {
                    const revenueData = await Order.aggregate([
                        { $match: { restaurantId: owner._id } },
                        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                    ]);
                    revenue = revenueData.length > 0 ? revenueData[0].total : 0;
                }
            } catch (e) {
                // Do not crash if orders fail
                revenue = 0; 
            }

            return { 
                ...owner._doc, 
                daysLeft,
                totalRevenue: revenue
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("❌ FETCH ERROR:", error);
        res.status(500).json({ message: "Server Error fetching data" });
    }
});

// ============================================================
// 🟢 2. ADD NEW RESTAURANT (CEO ONLY)
// ============================================================
router.post('/restaurant/add', protect, adminOnly, async (req, res) => {
    try {
        console.log("🎯 CEO: Adding new restaurant...");
        
        const { restaurantName, username, email, password, plan } = req.body;
        
        // Check if user already exists
        const existing = await Owner.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: "Username or email already exists" 
            });
        }
        
        // Create new owner
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Set trial period (30 days for trial, 365 for premium)
        const trialEndsAt = new Date();
        if (plan === "premium") {
            trialEndsAt.setDate(trialEndsAt.getDate() + 365);
        } else {
            trialEndsAt.setDate(trialEndsAt.getDate() + 30);
        }
        
        const newOwner = new Owner({
            restaurantName,
            username,
            email,
            password: hashedPassword,
            isActive: true,
            isPro: plan === "premium",
            trialEndsAt,
            role: "owner",
            createdAt: new Date()
        });
        
        await newOwner.save();
        
        console.log(`✅ New restaurant added: ${restaurantName}`);
        
        res.json({ 
            success: true, 
            message: "Restaurant added successfully",
            restaurant: newOwner 
        });
        
    } catch (error) {
        console.error("❌ Add Restaurant Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to add restaurant",
            error: error.message 
        });
    }
});

// ============================================================
// 🟢 3. MANAGEMENT ACTIONS
// ============================================================

// Block / Unblock
router.put('/restaurant/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { isActive } = req.body;
        await Owner.findByIdAndUpdate(req.params.id, { isActive });
        console.log(`🔄 Status Update: ${req.params.id} -> ${isActive}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset Password
router.put('/restaurant/:id/password', protect, adminOnly, async (req, res) => {
    try {
        const { password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await Owner.findByIdAndUpdate(req.params.id, { password: hashedPassword });
        console.log(`🔐 Password Reset for: ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Subscription Days
router.put('/restaurant/:id/subscription', protect, adminOnly, async (req, res) => {
    try {
        const { days } = req.body;
        const owner = await Owner.findById(req.params.id);
        
        let currentExpiry = new Date(owner.trialEndsAt || Date.now());
        if (currentExpiry < new Date()) currentExpiry = new Date();
        currentExpiry.setDate(currentExpiry.getDate() + parseInt(days));

        owner.trialEndsAt = currentExpiry;
        owner.isPro = true; 
        await owner.save();

        console.log(`📅 Added ${days} days to ${owner.username}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 🟢 4. PLATFORM STATS
// ============================================================

router.get('/platform-stats', protect, adminOnly, async (req, res) => {
    try {
        const totalClients = await Owner.countDocuments({});
        const proClients = await Owner.countDocuments({ isPro: true });
        const activeTrials = totalClients - proClients;
        const monthlyRecurringRevenue = proClients * 999;

        res.json({ totalClients, proClients, activeTrials, mrr: monthlyRecurringRevenue });
    } catch (error) {
        res.status(500).json({ message: "Stats Error" });
    }
});

router.post('/broadcast', protect, adminOnly, async (req, res) => {
    const io = req.app.get('socketio');
    if (io) {
        io.emit('new-broadcast', { ...req.body, timestamp: new Date() });
        res.json({ message: "Sent" });
    } else {
        res.status(500).json({ message: "Socket Error" });
    }
});

router.delete('/delete-owner/:id', protect, adminOnly, async (req, res) => {
    try {
        await Owner.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (error) {
        res.status(500).json({ message: "Delete Failed" });
    }
});

router.get('/ledger', protect, adminOnly, async (req, res) => {
    res.json({ message: "Ledger", ledger: [] });
});
// Add these routes to your existing superAdminRoutes.js

// ============================================================
// 🟢 ADD NEW RESTAURANT (SIMPLE VERSION)
// ============================================================
router.post('/restaurant/add', protect, adminOnly, async (req, res) => {
    try {
        const { restaurantName, username, email, phone, password, isPro } = req.body;
        
        // Check if exists
        const existing = await Owner.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: "Username or email already exists" 
            });
        }
        
        // Create
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newOwner = new Owner({
            restaurantName,
            username,
            email,
            phone,
            password: hashedPassword,
            isActive: true,
            isPro: isPro || false,
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            role: "owner",
            createdAt: new Date()
        });
        
        await newOwner.save();
        
        res.json({ 
            success: true, 
            message: "Restaurant added successfully",
            restaurant: newOwner 
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to add restaurant",
            error: error.message 
        });
    }
});

// ============================================================
// 🟢 GET RESTAURANT STATS
// ============================================================
router.get('/restaurant-stats', protect, adminOnly, async (req, res) => {
    try {
        const totalPartners = await Owner.countDocuments({ role: 'owner' });
        const activePartners = await Owner.countDocuments({ isActive: true, role: 'owner' });
        const premiumPartners = await Owner.countDocuments({ isPro: true, role: 'owner' });
        
        // Calculate total revenue
        const revenueData = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
        
        res.json({
            totalPartners,
            activePartners,
            premiumPartners,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: "Stats error" });
    }
});

export default router;