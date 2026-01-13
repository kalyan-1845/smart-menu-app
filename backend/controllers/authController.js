import Owner from '../models/Owner.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// --- 🛡️ TOKEN GENERATOR ---
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

// --- 📲 SAVE PUSH SUBSCRIPTION ---
export const saveSubscription = async (req, res) => {
    const { restaurantId, subscription } = req.body;
    try {
        const user = await Owner.findById(restaurantId);
        if (!user) return res.status(404).json({ message: "Restaurant not found" });

        const exists = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- 📝 REGISTER OWNER (Now saves Phone Number) ---
export const registerOwner = async (req, res) => {
    try {
        // ✅ 1. Destructure 'phoneNumber' from request body
        let { restaurantName, username, email, password, phoneNumber } = req.body;

        const cleanUsername = username.trim().toLowerCase();
        
        if (!email) email = `${cleanUsername}@kovixa.local`; 

        const userExists = await Owner.findOne({ 
            $or: [{ username: cleanUsername }, { email }] 
        });
        if (userExists) return res.status(400).json({ message: 'Unique ID or Email already taken.' });

        const freeAccessDate = new Date();
        freeAccessDate.setFullYear(freeAccessDate.getFullYear() + 100); 

        // ✅ 2. Save 'phoneNumber' to Database
        const user = await Owner.create({ 
            restaurantName: restaurantName.trim(), 
            username: cleanUsername, 
            email, 
            password, 
            phoneNumber: phoneNumber || "", // <--- ADDED THIS LINE
            trialEndsAt: freeAccessDate, 
            isPro: true
        });
        
        res.status(201).json({
            _id: user._id,
            username: user.username,
            token: generateToken(user._id)
        });
    } catch (error) { 
        res.status(400).json({ message: error.message }); 
    }
};

// --- 🔑 LOGIN OWNER ---
export const loginOwner = async (req, res) => {
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
        } else { 
            res.status(401).json({ message: 'Invalid credentials. Check your ID and Password.' }); 
        }
    } catch (error) { 
        res.status(500).json({ message: "Server Error during login." }); 
    }
};

// --- 🔍 GET OWNER ID BY USERNAME ---
export const getOwnerIdByUsername = async (req, res) => {
    try {
        const owner = await Owner.findOne({ 
            username: req.params.username.toLowerCase() 
        }).select('_id');

        if (!owner) return res.status(404).json({ message: "Restaurant ID not found" });
        
        res.json({ id: owner._id }); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 🌐 GET RESTAURANT DETAILS ---
export const getRestaurantDetails = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    try {
        const { id } = req.params;
        let owner;

        if (mongoose.Types.ObjectId.isValid(id)) {
            owner = await Owner.findById(id).select('username restaurantName isPro');
        } else {
            owner = await Owner.findOne({ username: id.toLowerCase() }).select('username restaurantName isPro');
        }

        if (!owner) return res.status(404).json({ message: 'Restaurant not found' });
        
        res.json({
            id: owner._id,
            username: owner.username,
            restaurantName: owner.restaurantName,
            isPro: owner.isPro
        });
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};