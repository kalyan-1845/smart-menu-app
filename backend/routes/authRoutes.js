import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import webpush from 'web-push'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- 🔑 SAFE WEB PUSH CONFIGURATION ---
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
    try {
        // Updated to match notificationRoutes.js for consistency
        webpush.setVapidDetails('mailto:support@kovixa.com', publicKey, privateKey);
        console.log("✅ Auth Routes: Push Initialized");
    } catch (err) { console.error("❌ VAPID Config Error"); }
}

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

// --- 📲 SAVE PUSH SUBSCRIPTION ---
router.post('/save-subscription', async (req, res) => {
    const { restaurantId, subscription } = req.body;
    try {
        const user = await Owner.findById(restaurantId);
        if (!user) return res.status(404).json({ message: "Restaurant not found" });

        // Prevent duplicate subscriptions
        const exists = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 📝 REGISTER ---
router.post('/register', async (req, res) => {
    try {
        let { restaurantName, username, email, password } = req.body;
        if (!email) email = `${username.toLowerCase()}@smartmenu.local`; 

        const userExists = await Owner.findOne({ $or: [{ username: username.toLowerCase() }, { email }] });
        if (userExists) return res.status(400).json({ message: 'User already exists.' });

        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 100); 

        const user = await Owner.create({ 
            restaurantName, 
            username: username.toLowerCase(), 
            email, 
            password, 
            trialEndsAt: expiryDate, 
            isPro: true
        });
        
        res.status(201).json({
            _id: user._id,
            username: user.username,
            token: generateToken(user._id)
        });
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// --- 🔑 LOGIN ---
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await Owner.findOne({ username: username.toLowerCase() });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                restaurantName: user.restaurantName,
                token: generateToken(user._id),
                isPro: user.isPro
            });
        } else { res.status(401).json({ message: 'Invalid credentials' }); }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- ✅ VERIFY ROLE (Optional now, but kept for legacy support) ---
router.post('/verify-role', async (req, res) => {
    try {
        const { role, username, password } = req.body;
        const user = await Owner.findOne({ username: username.toLowerCase() });
        
        if (!user) return res.status(404).json({ message: "Not found" });

        const validPass = role === 'chef' ? (user.chefPassword || "bitebox18") : (user.waiterPassword || "bitebox18"); 

        if (password === validPass) {
             return res.json({ 
                success: true, 
                role, 
                restaurantId: user._id,
                token: generateToken(user._id)
            });
        } else { return res.status(401).json({ message: "Wrong PIN" }); }
    } catch (error) { res.status(401).json({ message: "Invalid" }); }
});

// ============================================================
// 🎯 OWNER-ID LOOKUP (Crucial for Menu.js)
// ============================================================
router.get('/owner-id/:username', async (req, res) => {
    try {
        const owner = await Owner.findOne({ 
            username: req.params.username.toLowerCase() 
        }).select('_id');

        if (!owner) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json({ id: owner._id }); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============================================================
// 🌐 RESTAURANT DETAILS LOOKUP
// ============================================================
router.get('/restaurant/:id', async (req, res) => {
    // 1. Kill Cache to prevent old data issues
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    try {
        const { id } = req.params;
        let owner;

        // 2. INTELLIGENT SEARCH: Check if it's an ID or a Username
        if (mongoose.Types.ObjectId.isValid(id)) {
            owner = await Owner.findById(id).select('username restaurantName isPro');
        } else {
            owner = await Owner.findOne({ username: id.toLowerCase() }).select('username restaurantName isPro');
        }

        if (!owner) return res.status(404).json({ message: 'Restaurant not found' });
        
        // 3. Send back explicitly formatted data
        res.json({
            id: owner._id,
            _id: owner._id,
            username: owner.username,
            restaurantName: owner.restaurantName,
            isPro: owner.isPro
        });

    } catch (error) { 
        console.error("Lookup Error:", error);
        res.status(500).json({ message: error.message }); 
    }
});

export default router;