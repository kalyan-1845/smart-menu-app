import Call from '../models/Call.js';

// @desc    Create a new waiter call/request
// @route   POST /api/orders/call-waiter
export const createCall = async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body;
        
        const newCall = new Call({
            restaurantId,
            tableNumber,
            type: type || "help"
        });
        
        await newCall.save();

        // 🔔 Notify the Waiter/Chef Dashboard in real-time via Socket.io
        if (req.io) {
            // Join specific restaurant room for targeted notification
            req.io.to(restaurantId.toString()).emit('new-waiter-call', newCall);
            // Fallback for global broadcast if rooms aren't used
            req.io.emit('new-waiter-call', newCall);
        }

        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: "Call request failed", error: error.message });
    }
};

// @desc    Get all active calls for a restaurant
// @route   GET /api/orders/calls
export const getCalls = async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const calls = await Call.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: "Error fetching calls" });
    }
};

// @desc    Delete/Resolve a call (When staff clicks "Done")
// @route   DELETE /api/orders/calls/:id
export const resolveCall = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);
        if (!call) return res.status(404).json({ message: "Call not found" });

        await Call.findByIdAndDelete(req.params.id);

        // 🔌 Notify other staff that this call is handled
        if (req.io) {
            req.io.emit("call-resolved", { 
                id: req.params.id, 
                tableNumber: call.tableNumber,
                restaurantId: call.restaurantId 
            });
        }

        res.json({ message: "Call resolved and removed" });
    } catch (error) {
        res.status(500).json({ message: "Error resolving call" });
    }
};