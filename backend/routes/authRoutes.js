import express from 'express';
import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password, restaurantName } = req.body;
        const owner = new Owner({ username, password, restaurantName });
        await owner.save();
        res.status(201).json({ success: true });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const owner = await Owner.findOne({ username });
        if (owner && (await owner.matchPassword(password))) {
            const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET || 'secret');
            res.json({ _id: owner._id, username: owner.username, restaurantName: owner.restaurantName, token });
        } else { res.status(401).json({ message: "Invalid" }); }
    } catch (e) { res.status(500).json({ message: "Error" }); }
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