import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import webpush from 'web-push'; 
import Owner from '../models/Owner.js'; 
import Dish from '../models/Dish.js'; 
import Order from '../models/Order.js'; 

const router = express.Router();

// ==========================================
// 🔑 SAFE WEB PUSH CONFIGURATION
// ==========================================
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails(
            'mailto:support@bitebox.com',
            publicKey,
            privateKey
        );
        console.log("✅ Auth Routes: Push Initialized");
    } catch (err) {
        console.error("❌ VAPID Config Error:", err.message);
    }
}

// Helper: Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

// ==========================================
// 📥 DASHBOARD & ORDERS (Legacy Support)
// ==========================================

// GET INBOX
router.get('/inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
        const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET SALES SUMMARY
router.get('/sales-summary', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });

        const orders = await Order.find({ restaurantId, status: 'Completed' });
        const totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
        
        res.json({
            totalRevenue,
            totalOrders: orders.length,
            recentOrders: orders.slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// SAVE SUBSCRIPTION
router.post('/save-subscription', async (req, res) => {
    const { restaurantId, subscription } = req.body;
    try {
        const user = await Owner.findById(restaurantId);
        if (!user) return res.status(404).json({ message: "Restaurant not found" });

        // Avoid duplicates
        const exists = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }
        res.status(200).json({ success: true, message: "Subscription saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 🔐 AUTHENTICATION
// ==========================================

// REGISTER
router.post('/register', async (req, res) => {
    try {
        let { restaurantName, username, email, password, trialEndsAt } = req.body;

        if (!email) email = `${username.replace(/\s+/g, '')}@smartmenu.local`; 
        if (!trialEndsAt) {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 100); 
            trialEndsAt = date.toISOString();
        }

        const userExists = await Owner.findOne({ $or: [{ username }, { email }] });
        if (userExists) return res.status(400).json({ message: 'Username or Email already registered.' });

        const user = await Owner.create({ 
            restaurantName, username, email, password, trialEndsAt, isPro: true
        });
        
        res.status(201).json({
            _id: user._id,
            username: user.username,
            restaurantName: user.restaurantName,
            token: generateToken(user._id),
            trialEndsAt: user.trialEndsAt
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await Owner.findOne({ username });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                restaurantName: user.restaurantName,
                token: generateToken(user._id),
                isPro: user.isPro,
                trialEndsAt: user.trialEndsAt
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// VERIFY ROLE (Chef/Waiter/Owner)
router.post('/verify-role', async (req, res) => {
    try {
        const { role, username, password, token } = req.body;

        if (role === 'chef' || role === 'waiter') {
            const user = await Owner.findOne({ username });
            
            if (!user) return res.status(404).json({ message: "Restaurant not found" });

            const validPass = role === 'chef' ? (user.chefPassword || "bitebox18") : (user.waiterPassword || "bitebox18"); 

            if (password === validPass) {
                 return res.json({ 
                    success: true, 
                    role: role, 
                    _id: user._id, 
                    restaurantId: user._id 
                });
            } else {
                return res.status(401).json({ message: "Wrong Password" });
            }
        }

        const actualToken = token || req.headers.authorization?.split(" ")[1];
        if (!actualToken) return res.status(401).json({ message: "No token" });

        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || 'fallback_secret');
        const user = await Owner.findById(decoded.id).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ role: "owner", _id: user._id, restaurantName: user.restaurantName });

    } catch (error) {
        res.status(401).json({ message: "Invalid Credentials" });
    }
});

// GET CURRENT USER
router.get('/verify-role', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "No token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await Owner.findById(decoded.id).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ success: true, role: "owner", _id: user._id, restaurantName: user.restaurantName });
    } catch (error) {
        res.status(401).json({ message: "Invalid Token" });
    }
});

// ==========================================
// 🔍 PUBLIC RESTAURANT LOOKUP (FIXED)
// ==========================================
router.get('/restaurant/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let owner;

        // 🛑 STRICT CHECK: Only check ID if it's 24-char HEX
        // This prevents "kalyanresto1" (12 chars) from looking like an ID
        const isValidHexId = /^[0-9a-fA-F]{24}$/.test(id);

        if (isValidHexId) {
            owner = await Owner.findById(id).select('username restaurantName email isPro upiId');
        } 
        
        // If not found by ID (or not a valid ID), try username
        if (!owner) {
            owner = await Owner.findOne({ 
                username: { $regex: new RegExp("^" + id + "$", "i") } 
            }).select('username restaurantName email isPro upiId');
        }

        if (!owner) return res.status(404).json({ message: 'Restaurant not found' });
        
        res.json(owner);
    } catch (error) {
        console.error("Lookup Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// GET ALL RESTAURANTS
router.get('/restaurants', async (req, res) => {
    try {
        const owners = await Owner.find().select('_id username restaurantName');
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- ADMIN ROUTES ---
router.get('/admin/all-owners', async (req, res) => {
    try {
        const owners = await Owner.find().select('-password').sort({ createdAt: -1 }); 
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/admin/delete-owner/:id', async (req, res) => {
    try {
        const ownerId = req.params.id;
        await Owner.findByIdAndDelete(ownerId);
        await Dish.deleteMany({ restaurantId: ownerId }); 
        await Order.deleteMany({ restaurantId: ownerId });
        res.json({ message: "Owner deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;