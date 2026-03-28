import express from 'express';
import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password, restaurantName } = req.body;
        if (!username || !password || !restaurantName) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const owner = new Owner({ username, password, restaurantName });
        await owner.save();
        res.status(201).json({ success: true });
    } catch (e) {
        console.error("Registration Error:", e.message);
        if (e.code === 11000) return res.status(409).json({ message: "Username already taken (duplicate)" });
        res.status(500).json({ message: "Registration Failed: " + e.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const owner = await Owner.findOne({ username });
        if (owner && (await owner.matchPassword(password))) {
            const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET || 'secret');
            res.json({ _id: owner._id, username: owner.username, restaurantName: owner.restaurantName, token });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (e) {
        console.error("Login Error:", e.message);
        res.status(500).json({ message: "Login Error: " + e.message });
    }
});

// ⚡️ CART FIX: Resolve Username -> ID
router.get('/owner-id/:username', async (req, res) => {
    try {
        const owner = await Owner.findOne({ username: req.params.username }).select('_id restaurantName');
        if (owner) res.json({ id: owner._id, name: owner.restaurantName });
        else res.status(404).json({ message: "Not Found" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

export default router;