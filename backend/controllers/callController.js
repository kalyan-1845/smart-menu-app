import Call from '../models/Call.js';
import mongoose from 'mongoose';

// ============================================================
// 1. CREATE CALL (Customer triggers Waiter/Help)
// ============================================================
export const createCall = async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body;
        
        // 🛡️ STOP CRASH: Ensure ID is valid before saving
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }

        const newCall = new Call({
            restaurantId,
            tableNumber,
            type: type || "help"
        });
        
        await newCall.save();

        // 🔔 REAL-TIME: Push to specific Restaurant Room
        if (req.io) {
            req.io.to(restaurantId.toString()).emit('new-waiter-call', newCall);
        }

        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: "Call failed", error: error.message });
    }
};

// ============================================================
// 2. GET CALLS (Dashboard Sync - Fixes Sync Errors)
// ============================================================
export const getCalls = async (req, res) => {
    try {
        const { restaurantId } = req.query;

        // 🛡️ STOP 500 ERROR: Validate ID before querying
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.json([]); 
        }

        const calls = await Call.find({ restaurantId })
            .sort({ createdAt: -1 })
            .lean(); // 🚀 .lean() makes this lookup super fast

        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: "Error fetching calls" });
    }
};

// ============================================================
// 3. RESOLVE CALL (Staff clicks "Done")
// ============================================================
export const resolveCall = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);
        if (!call) return res.status(404).json({ message: "Call not found" });

        await Call.findByIdAndDelete(req.params.id);

        // 🔌 Real-time update for other staff
        if (req.io) {
            req.io.to(call.restaurantId.toString()).emit("call-resolved", { 
                id: req.params.id, 
                tableNumber: call.tableNumber 
            });
        }

        res.json({ message: "Call resolved" });
    } catch (error) {
        res.status(500).json({ message: "Error resolving call" });
    }
};