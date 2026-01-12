import express from 'express';
import jwt from 'jsonwebtoken';
import webpush from 'web-push'; 
import Owner from '../models/Owner.js'; 
import { getRestaurantPublic } from '../controllers/authController.js'; // ✅ Import the new controller

const router = express.Router();

// --- 🔑 WEB PUSH CONFIG ---
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails('mailto:support@kovixa.com', publicKey, privateKey);
    } catch (err) { console.error("VAPID Config Error"); }
}

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

// --- 🌐 PUBLIC RESTAURANT DATA (Optimized Controller) ---
router.get('/restaurant/:id', getRestaurantPublic);

// --- 🎯 OWNER-ID LOOKUP (Crucial for Menu.js) ---
router.get('/owner-id/:username', async (req, res) => {
    try {
        // Simple, fast lookup for internal ID resolution
        const owner = await Owner.findOne({ 
            username: req.params.username.toLowerCase() 
        }).select('_id');

        if (!owner) return res.status(404).json({ message: "Not found" });
        res.json({ id: owner._id }); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 📝 REGISTER ---
router.post('/register', async (req, res) => {
    try {
        let { restaurantName, username, email, password } = req.body;
        if (!email) email = `${username.toLowerCase()}@smartmenu.local`; 

        const userExists = await Owner.findOne({ $or: [{ username: username.toLowerCase() }, { email }] });
        if (userExists) return res.status(400).json({ message: 'User already exists.' });

        const user = await Owner.create({ 
            restaurantName, 
            username: username.toLowerCase(), 
            email, 
            password, 
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

// --- 📲 SAVE PUSH SUBSCRIPTION ---
router.post('/save-subscription', async (req, res) => {
    const { restaurantId, subscription } = req.body;
    try {
        const user = await Owner.findById(restaurantId);
        if (user) {
            const exists = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
            if (!exists) {
                user.pushSubscriptions.push(subscription);
                await user.save();
            }
            res.status(200).json({ success: true });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;