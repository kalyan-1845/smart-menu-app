import Owner from '../models/Owner.js';
import jwt from 'jsonwebtoken';

// ==========================================
// 1. CEO SYNC (Get Dashboard Data)
// ==========================================
export const getCEOStats = async (req, res) => {
    try {
        const clients = await Owner.find({})
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        const analyzed = clients.map(c => {
            const daysInactive = (Date.now() - new Date(c.updatedAt)) / (1000 * 60 * 60 * 24);
            let health = "🟢 Healthy";
            if (!c.settings.menuActive) health = "🔴 Suspended";
            else if (daysInactive > 7) health = "🟡 Idle";
            
            return { ...c, health, lastActive: `${Math.floor(daysInactive)}d ago` };
        });

        res.json(analyzed);
    } catch (error) {
        res.status(500).json({ message: "Sync Failed" });
    }
};

// ==========================================
// 2. TOGGLE FEATURES (Kill Switch)
// ==========================================
export const toggleFeature = async (req, res) => {
    try {
        const { field, value } = req.body;
        await Owner.findByIdAndUpdate(req.params.ownerId, {
            $set: { [field]: value }
        });
        res.json({ success: true, message: "Switch Toggled" });
    } catch (error) {
        res.status(500).json({ message: "Toggle Failed" });
    }
};

// ==========================================
// 3. UPDATE NOTES (Private Intelligence)
// ==========================================
export const updateNotes = async (req, res) => {
    try {
        await Owner.findByIdAndUpdate(req.params.ownerId, {
            ceoNotes: req.body.notes
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Save Failed" });
    }
};

// ==========================================
// 4. GHOST LOGIN (God Mode)
// ==========================================
export const ghostLogin = async (req, res) => {
    try {
        const targetUser = await Owner.findById(req.params.ownerId);
        if (!targetUser) return res.status(404).json({ message: "User not found" });

        const token = jwt.sign(
            { id: targetUser._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ 
            token, 
            _id: targetUser._id,
            username: targetUser.username 
        });
    } catch (error) {
        res.status(500).json({ message: "Ghost Protocol Failed" });
    }
};

// ==========================================
// 5. SEND BROADCAST (Push Notifications)
// ==========================================
export const sendBroadcast = async (req, res) => {
    // Placeholder for future Broadcast logic
    res.json({ message: "Broadcast sent (Feature coming soon)" });
};

// ==========================================
// 6. MAINTENANCE STATUS (The Fix for your 404)
// ==========================================
export const getMaintenanceStatus = (req, res) => {
    // Return 'enabled: false' to keep the app running normally
    res.json({ enabled: false, message: "Systems Operational" });
};

export const toggleMaintenance = async (req, res) => {
    // Logic to toggle global maintenance would go here
    // For now, we just acknowledge the request
    res.json({ message: "Maintenance toggle not yet connected to DB" });
};