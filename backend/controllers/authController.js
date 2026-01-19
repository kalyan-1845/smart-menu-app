import Owner from '../models/Owner.js';
import jwt from 'jsonwebtoken';

// --- 1. REGISTER (Create New Restaurant) ---
export const registerOwner = async (req, res) => {
    try {
        const { username, password, restaurantName, phoneNumber } = req.body;

        const existing = await Owner.findOne({ username });
        if (existing) return res.status(400).json({ message: "Username taken" });

        const owner = new Owner({
            username,
            password, // Hashing is handled in the Model pre-save hook
            restaurantName,
            phoneNumber,
            isPro: true // Defaulting to TRUE so you see the "Premium" badge
        });

        await owner.save();

        res.status(201).json({ success: true, message: "Restaurant Created" });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- 2. LOGIN (Matches your RestaurantAdmin.jsx) ---
export const loginOwner = async (req, res) => {
    try {
        const { username, password } = req.body;
        const owner = await Owner.findOne({ username });

        if (owner && (await owner.matchPassword(password))) {
            const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

            // ✅ Exact response expected by handleLogin in RestaurantAdmin.jsx
            res.json({
                _id: owner._id,
                username: owner.username,
                restaurantName: owner.restaurantName,
                isPro: owner.isPro, // Used for the "PREMIUM DASHBOARD" badge
                token
            });
        } else {
            res.status(401).json({ message: "Invalid Credentials" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- 3. GET ID BY USERNAME (Matches your Menu.jsx) ---
// This is critical for: const realMongoId = idRes.data.id;
export const getOwnerIdByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        // We select minimal fields for security (Public Endpoint)
        const owner = await Owner.findOne({ username }).select('_id restaurantName isPro settings');

        if (owner) {
            res.json({ 
                id: owner._id, // <--- Menu.jsx looks for this specific key
                name: owner.restaurantName,
                isPro: owner.isPro,
                settings: owner.settings
            });
        } else {
            res.status(404).json({ message: "Restaurant Not Found" });
        }
    } catch (error) {
        console.error("ID Resolve Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- 4. GET RESTAURANT DETAILS ---
export const getRestaurantDetails = async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id).select('-password');
        if (owner) res.json(owner);
        else res.status(404).json({ message: "Not found" });
    } catch (e) {
        res.status(500).json({ message: "Error" });
    }
};

// --- 5. SUBSCRIPTION (Optional Placeholder) ---
export const saveSubscription = async (req, res) => {
    res.json({ success: true });
};