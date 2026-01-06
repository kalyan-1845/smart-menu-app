import express from 'express';
import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';
import Order from '../models/Order.js'; // Needed for stats & reset
import Settings from '../models/Settings.js'; 

const router = express.Router();

// 🔐 MASTER PASSWORD CONFIGURATION
const MASTER_PASSWORD = "vasudevsrinivas"; 
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// --- MIDDLEWARE TO PROTECT ROUTES ---
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No Token" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'superadmin') throw new Error();
        next();
    } catch (e) {
        res.status(401).json({ message: "Invalid Token" });
    }
};

// ==========================================
// 1. 🔑 SUPER LOGIN
// ==========================================
router.post('/login', (req, res) => {
    const { password } = req.body;

    if (password === MASTER_PASSWORD) {
        // Generate Token
        const token = jwt.sign({ role: 'superadmin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token });
    } else {
        return res.status(401).json({ success: false, message: "Invalid Password" });
    }
});

// ==========================================
// 2. 🔄 CEO SYNC (Dashboard Data)
// ==========================================
router.get('/ceo-sync', protect, async (req, res) => {
    try {
        const clients = await Owner.find({}).select('-password').sort({ createdAt: -1 }).lean();
        const settings = await Settings.getSettings();

        // Calculate detailed stats
        const detailedClients = await Promise.all(clients.map(async (c) => {
            const orderCount = await Order.countDocuments({ restaurantId: c._id });
            const revenue = await Order.aggregate([
                { $match: { restaurantId: c._id } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]);

            const daysInactive = (Date.now() - new Date(c.updatedAt)) / (1000 * 60 * 60 * 24);
            
            let health = "🟢 Healthy";
            if (!c.settings?.menuActive) health = "🔴 Suspended";
            else if (daysInactive > 7) health = "🟡 Idle";

            return { 
                ...c, 
                health, 
                totalRevenue: revenue[0]?.total || 0,
                itemCount: orderCount,
                lastActive: `${Math.floor(daysInactive)}d ago`
            };
        }));

        res.json(detailedClients);
    } catch (error) {
        res.status(500).json({ message: "Sync Failed" });
    }
});

// ==========================================
// 3. 📝 UPDATE CLIENT (Change Password/Details)
// ==========================================
router.put('/client/:id', protect, async (req, res) => {
    try {
        const { restaurantName, username, phoneNumber, password } = req.body;
        
        const updateData = { 
            restaurantName, 
            username, 
            phoneNumber 
        };

        // ✅ If a new password is typed, update it. If empty, ignore.
        if (password && password.trim() !== "") {
            updateData.password = password; 
        }

        await Owner.findByIdAndUpdate(req.params.id, updateData);
        res.json({ success: true, message: "Client Updated" });
    } catch (error) {
        res.status(500).json({ message: "Update Failed" });
    }
});

// ==========================================
// 4. 🗑️ DELETE CLIENT (Permanent)
// ==========================================
router.delete('/client/:id', protect, async (req, res) => {
    try {
        await Owner.findByIdAndDelete(req.params.id);
        await Order.deleteMany({ restaurantId: req.params.id }); // Clean up orders
        res.json({ success: true, message: "Account Deleted" });
    } catch (error) {
        res.status(500).json({ message: "Delete Failed" });
    }
});

// ==========================================
// 5. 🔄 RESET DATA (Clear Orders)
// ==========================================
router.post('/client/:id/reset', protect, async (req, res) => {
    try {
        await Order.deleteMany({ restaurantId: req.params.id });
        res.json({ success: true, message: "Data Wiped" });
    } catch (error) {
        res.status(500).json({ message: "Reset Failed" });
    }
});

// ==========================================
// 6. KILL SWITCH (Menu/Chef Toggles)
// ==========================================
router.put('/control/:id', protect, async (req, res) => {
    try {
        const { field, value } = req.body; 
        await Owner.findByIdAndUpdate(req.params.id, { $set: { [field]: value } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Switch Failed" }); }
});

// ==========================================
// 7. PRIVATE NOTES
// ==========================================
router.put('/notes/:id', protect, async (req, res) => {
    try {
        await Owner.findByIdAndUpdate(req.params.id, { ceoNotes: req.body.notes });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Save Failed" }); }
});

// ==========================================
// 8. GHOST LOGIN (Login as Owner)
// ==========================================
router.get('/ghost-login/:id', protect, async (req, res) => {
    try {
        const targetUser = await Owner.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ message: "User gone" });
        
        // Create a temporary token for the specific user
        const token = jwt.sign({ id: targetUser._id }, JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ 
            token, 
            ownerId: targetUser._id,
            username: targetUser.username 
        });
    } catch (error) { res.status(500).json({ message: "Ghost Protocol Failed" }); }
});

// ==========================================
// 9. MAINTENANCE MODE (System Wide)
// ==========================================
router.get('/maintenance-status', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({ enabled: settings.maintenanceMode, message: settings.broadcastMessage });
    } catch (e) { res.json({ enabled: false }); }
});

router.post('/toggle-maintenance', protect, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        settings.maintenanceMode = !settings.maintenanceMode;
        await settings.save();
        res.json({ success: true, message: `Maintenance ${settings.maintenanceMode ? 'ON' : 'OFF'}` });
    } catch (e) { res.status(500).json({ message: "Update Failed" }); }
});

export default router;