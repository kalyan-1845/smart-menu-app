import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import webpush from 'web-push'; // Required for notifications
import Owner from '../models/Owner.js'; 
import Dish from '../models/Dish.js'; 
import Order from '../models/Order.js'; 

const router = express.Router();

// --- 🔑 WEB PUSH CONFIGURATION ---
// These should ideally be in your .env file
webpush.setVapidDetails(
    'mailto:support@bitebox.com',
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

// --- 📲 NEW: SAVE PUSH SUBSCRIPTION ---
// This allows the mobile app to save the phone's "address" for notifications
router.post('/save-subscription', async (req, res) => {
    const { restaurantId, subscription } = req.body;
    try {
        const user = await Owner.findById(restaurantId);
        if (!user) return res.status(404).json({ message: "Restaurant not found" });

        // Check if subscription already exists to avoid duplicates
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

// --- REGISTER ROUTE ---
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

// --- LOGIN ROUTE ---
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

// --- ✅ FIXED: VERIFY ROLE (Chef AND Waiter Support) ---
router.post('/verify-role', async (req, res) => {
    try {
        const { role, username, password, token } = req.body;

        if (role === 'chef' || role === 'waiter') {
            const user = await Owner.findOne({ username });
            
            if (!user) return res.status(404).json({ message: "Restaurant not found" });

            // Safety: Check correct password based on role
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

// --- ✅ PUBLIC RESTAURANT LOOKUP ---
router.get('/restaurant/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let owner;

        if (mongoose.Types.ObjectId.isValid(id)) {
            owner = await Owner.findById(id).select('username restaurantName email isPro upiId');
        } 
        
        if (!owner) {
            owner = await Owner.findOne({ username: id }).select('username restaurantName email isPro upiId');
        }

        if (!owner) return res.status(404).json({ message: 'Restaurant not found' });
        
        res.json(owner);
    } catch (error) {
        console.error("Lookup Error:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/restaurants', async (req, res) => {
    try {
        const owners = await Owner.find().select('_id username restaurantName');
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

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