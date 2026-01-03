import express from 'express';
import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';
import Settings from '../models/Settings.js'; // 👈 IMPORT THE NEW MODEL

const router = express.Router();

// 🛡️ Middleware Mock
const protect = (req, res, next) => next(); 

// ==========================================
// 1. MAINTENANCE STATUS (Now Dynamic!)
// ==========================================
router.get('/maintenance-status', async (req, res) => {
    try {
        // Get status from DB
        const settings = await Settings.getSettings();
        res.json({ 
            enabled: settings.maintenanceMode, 
            message: settings.broadcastMessage || "System Operational" 
        });
    } catch (e) {
        // Fallback if DB fails
        res.json({ enabled: false, message: "System Operational" });
    }
});

router.post('/toggle-maintenance', protect, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        settings.maintenanceMode = !settings.maintenanceMode;
        await settings.save();
        
        res.json({ 
            success: true, 
            message: `Maintenance is now ${settings.maintenanceMode ? 'ON' : 'OFF'}` 
        });
    } catch (e) {
        res.status(500).json({ message: "Update Failed" });
    }
});

// ==========================================
// 2. CEO SYNC
// ==========================================
router.get('/ceo-sync', protect, async (req, res) => {
    try {
        const clients = await Owner.find({}).select('-password').sort({ createdAt: -1 }).lean();
        const settings = await Settings.getSettings(); // Get global settings too

        const analyzed = clients.map(c => {
            const daysInactive = (Date.now() - new Date(c.updatedAt)) / (1000 * 60 * 60 * 24);
            let health = "🟢 Healthy";
            if (!c.settings?.menuActive) health = "🔴 Suspended";
            else if (daysInactive > 7) health = "🟡 Idle";
            return { ...c, health, lastActive: `${Math.floor(daysInactive)}d ago` };
        });

        // Send back clients AND the global maintenance status
        res.json({ clients: analyzed, globalSettings: settings });
    } catch (error) {
        res.status(500).json({ message: "Sync Failed" });
    }
});

// ==========================================
// 3. KILL SWITCH
// ==========================================
router.put('/control/:id', protect, async (req, res) => {
    try {
        const { field, value } = req.body; 
        await Owner.findByIdAndUpdate(req.params.id, { $set: { [field]: value } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Switch Failed" }); }
});

// ==========================================
// 4. NOTES
// ==========================================
router.put('/notes/:id', protect, async (req, res) => {
    try {
        await Owner.findByIdAndUpdate(req.params.id, { ceoNotes: req.body.notes });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Save Failed" }); }
});

// ==========================================
// 5. GHOST LOGIN
// ==========================================
router.get('/ghost-login/:id', protect, async (req, res) => {
    try {
        const targetUser = await Owner.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ message: "User gone" });
        const secret = process.env.JWT_SECRET || "fallback_secret";
        const token = jwt.sign({ id: targetUser._id }, secret, { expiresIn: '1h' });
        res.json({ token, _id: targetUser._id, username: targetUser.username });
    } catch (error) { res.status(500).json({ message: "Ghost Protocol Failed" }); }
});

export default router;