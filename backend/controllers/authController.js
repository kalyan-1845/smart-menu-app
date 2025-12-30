import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';

// ✅ 1. OWNER LOGIN (Matches OwnerLogin.jsx)
export const loginOwner = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find by username
        const user = await Owner.findOne({ username });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Check Active Status
        if (!user.isActive) return res.status(403).json({ message: "Account Suspended by CEO" });

        // Generate Token
        const token = jwt.sign({ id: user._id, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            _id: user._id,
            username: user.username,
            restaurantName: user.restaurantName,
            isPro: user.isPro,
            trialEndsAt: user.trialEndsAt
        });
    } catch (err) {
        res.status(500).json({ message: "Server Login Error" });
    }
};

// ✅ 2. GET RESTAURANT FOR MENU (Matches Menu.jsx)
export const getRestaurantPublic = async (req, res) => {
    try {
        const { id } = req.params;
        let restaurant;

        // Check if "id" is a MongoID (24 chars) or a Username
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            restaurant = await Owner.findById(id).select('-password');
        } else {
            restaurant = await Owner.findOne({ username: id }).select('-password');
        }

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json(restaurant);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};