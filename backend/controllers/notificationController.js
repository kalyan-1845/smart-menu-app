import Call from '../models/Call.js';

// @desc    Create a new waiter call (Handles /notify and /send endpoints)
export const createCall = async (req, res) => {
    try {
        console.log("🔔 Call Request:", req.body);

        // 1. Get Data (Frontend sends mixed field names, we catch them all)
        const { restaurantId, tableNumber, table, type, title, message } = req.body;
        
        const actualTable = tableNumber || table;
        const actualMessage = message || title || "Customer requested assistance";

        if (!restaurantId || !actualTable) {
            return res.status(400).json({ message: "Missing restaurantId or tableNumber" });
        }

        // 2. Save to DB
        const newCall = new Call({
            restaurantId,
            tableNumber: actualTable,
            type: type || "help", 
            message: actualMessage
        });
        
        await newCall.save();

        // 3. Real-time Alert
        if (req.io) {
            const room = restaurantId.toString();
            // Emit to specific restaurant room
            req.io.to(room).emit('new-waiter-call', newCall);
            // Broadcast globally just in case
            req.io.emit('new-waiter-call', newCall);
            console.log(`📡 Alert sent to ${room}`);
        }

        res.status(201).json(newCall);

    } catch (error) {
        console.error("Call Error:", error);
        res.status(500).json({ message: "Call request failed" });
    }
};

// @desc    Get active calls
export const getCalls = async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if(!restaurantId) return res.status(400).json({message: "Restaurant ID required"});
        
        const calls = await Call.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: "Error fetching calls" });
    }
};

// @desc    Resolve call
export const resolveCall = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);
        if (call) {
            await Call.findByIdAndDelete(req.params.id);
            // Notify frontend to remove the card
            if (req.io) {
                const payload = { id: req.params.id, restaurantId: call.restaurantId };
                req.io.to(call.restaurantId.toString()).emit("call-resolved", payload);
                req.io.emit("call-resolved", payload);
            }
        }
        res.json({ message: "Call resolved" });
    } catch (error) {
        res.status(500).json({ message: "Error resolving call" });
    }
};