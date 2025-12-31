import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Owner from '../models/Owner.js';

const router = express.Router();

// ✅ FIXED: Verify Role for Chef, Waiter, and Owner
router.post('/verify-role', async (req, res) => {
    try {
        const { role, username, password, token } = req.body;

        // Support for Chef/Waiter Login
        if (role === 'chef' || role === 'waiter') {
            const user = await Owner.findOne({ username });
            if (!user) return res.status(404).json({ message: "Restaurant not found" });

            const validPass = user.chefPassword || "bitebox18"; 
            if (password === validPass) {
                 return res.json({ 
                    success: true, 
                    role: role, 
                    restaurantId: user._id 
                });
            } else {
                return res.status(401).json({ message: "Wrong Password" });
            }
        }

        // Support for Owner Token Check
        const actualToken = token || req.headers.authorization?.split(" ")[1];
        if (!actualToken) return res.status(401).json({ message: "No token" });

        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || 'fallback_secret');
        const user = await Owner.findById(decoded.id).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ success: true, role: "owner", _id: user._id, restaurantName: user.restaurantName });

    } catch (error) {
        res.status(401).json({ message: "Invalid Credentials" });
    }
});

// ✅ FIXED: Secure Restaurant Lookup
router.get('/restaurant/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let owner;
        if (mongoose.Types.ObjectId.isValid(id)) {
            owner = await Owner.findById(id).select('username restaurantName isPro upiId');
        } 
        if (!owner) {
            owner = await Owner.findOne({ username: id }).select('username restaurantName isPro upiId');
        }
        if (!owner) return res.status(404).json({ message: 'Not found' });
        res.json(owner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;