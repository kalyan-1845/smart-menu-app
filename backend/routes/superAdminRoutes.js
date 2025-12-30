import express from 'express';
import bcrypt from 'bcryptjs';
import Owner from '../models/Owner.js'; 
import Order from '../models/Order.js'; 
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔒 SECURITY: Only allow "srinivas" or "superadmin"
const adminOnly = (req, res, next) => {
    if (req.user && (req.user.username === "srinivas" || req.user.role === "superadmin")) {
        next();
    } else {
        res.status(403).json({ message: "⛔ Access Denied: CEO Only" });
    }
};

// ============================================================
// 1. DASHBOARD DATA (Matches your 'restaurants' state)
// ============================================================
router.get('/restaurants', protect, adminOnly, async (req, res) => {
    try {
        const owners = await Owner.find({}).select('-password').sort({ createdAt: -1 });
        
        const data = await Promise.all(owners.map(async (owner) => {
            const daysLeft = owner.trialEndsAt 
                ? Math.ceil((new Date(owner.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)) 
                : 0;

            let revenue = 0;
            try {
                // Aggregates total revenue from Orders collection
                const revenueData = await Order.aggregate([
                    { $match: { restaurantId: owner._id } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                ]);
                revenue = revenueData.length > 0 ? revenueData[0].total : 0;
            } catch (e) { revenue = 0; }

            return { ...owner._doc, daysLeft, totalRevenue: revenue };
        }));

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
    }
});

// ============================================================
// 2. REGISTER NEW RESTAURANT (Matches your AddRestaurant.jsx)
// ============================================================
router.post('/register', async (req, res) => {
    // Note: This endpoint is open so /superresturant works without login if you prefer,
    // or add 'protect, adminOnly' if you want it secured.
    try {
        const { restaurantName, username, password, email, phone, address } = req.body;
        
        const existing = await Owner.findOne({ username });
        if (existing) return res.status(400).json({ message: "Username already taken." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newOwner = await Owner.create({
            restaurantName, username, email, phone, address,
            password: hashedPassword,
            role: 'owner',
            isActive: true,
            isPro: true,
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Days Free
        });

        res.json({ success: true, message: `✅ ${restaurantName} Created Successfully!` });
    } catch (err) {
        res.status(500).json({ message: "Registration Failed: " + err.message });
    }
});

// ============================================================
// 3. DEEP DIVE (Matches your Ghost Modal)
// ============================================================
router.get('/restaurant/:id/deep-dive', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const owner = await Owner.findById(id).select('-password');
        if (!owner) return res.status(404).json({ message: "Restaurant Not Found" });

        const orders = await Order.find({ restaurantId: id }).sort({ createdAt: -1 }).limit(50);
        const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        
        res.json({
            identity: owner,
            stats: {
                totalRevenue,
                totalOrders: orders.length,
                avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ============================================================
// 4. ACTIONS (Matches your Modal Buttons)
// ============================================================

// Enable/Disable
router.put('/restaurant/:id/status', protect, adminOnly, async (req, res) => {
    try {
        await Owner.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive });
        res.json({ success: true, message: "Status Updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add 30 Days
router.put('/restaurant/:id/subscription', protect, adminOnly, async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id);
        let currentExpiry = new Date(owner.trialEndsAt || Date.now());
        if (currentExpiry < new Date()) currentExpiry = new Date();
        currentExpiry.setDate(currentExpiry.getDate() + 30);

        owner.trialEndsAt = currentExpiry;
        owner.isPro = true; 
        await owner.save();
        res.json({ success: true, message: "Added 30 Days Validity" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset Password
router.put('/restaurant/:id/password', protect, adminOnly, async (req, res) => {
    try {
        const { password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await Owner.findByIdAndUpdate(req.params.id, { password: hashedPassword });
        res.json({ success: true, message: "Password Reset Successful" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete Restaurant
router.delete('/restaurant/:id', protect, adminOnly, async (req, res) => {
    try {
        await Owner.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Restaurant Deleted Permanently" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Broadcast
router.post('/broadcast', protect, adminOnly, async (req, res) => {
    const io = req.app.get('socketio');
    if (io) {
        io.emit('new-broadcast', { ...req.body, timestamp: new Date() });
        res.json({ message: "📢 Broadcast Sent Successfully!" });
    } else {
        res.status(500).json({ message: "Socket Server Offline" });
    }
});

export default router;