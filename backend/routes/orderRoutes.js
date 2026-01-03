import express from 'express';
import mongoose from 'mongoose'; 
import webpush from 'web-push'; // Required for mobile push alerts
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- 🔑 WEB PUSH CONFIGURATION ---
// Ensure keys exist to prevent crash
if (process.env.PUBLIC_VAPID_KEY && process.env.PRIVATE_VAPID_KEY) {
    webpush.setVapidDetails(
        'mailto:support@bitebox.com',
        process.env.PUBLIC_VAPID_KEY,
        process.env.PRIVATE_VAPID_KEY
    );
}

// ==========================================
// 🚀 SPECIFIC ROUTES (MUST BE AT THE TOP)
// ==========================================

// --- 1. GET INBOX (MOVED UP) ---
// Kept at top so "inbox" isn't treated as an ID
router.get('/inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });
        
        const orders = await Order.find({ restaurantId, isDownloaded: false }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 2. GET WAITER CALLS (HISTORY) ---
router.get('/calls', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID format" });
        }
        const calls = await Call.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 3. DELETE WAITER CALL ---
router.delete('/calls/:callId', async (req, res) => {
    try {
        await Call.findByIdAndDelete(req.params.callId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete call" });
    }
});

// --- 4. CLEAR INBOX ---
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });
        await Order.updateMany({ restaurantId, isDownloaded: false }, { $set: { isDownloaded: true } });
        res.status(200).json({ message: "Inbox cleared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear inbox" });
    }
});

// --- 5. CALL WAITER (POST) ---
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body; 
        const newCall = await Call.create({ restaurantId, tableNumber, type: type || 'help' });
        
        if (req.io) {
            req.io.to(restaurantId.toString()).emit('new-waiter-call', newCall);
        }

        try {
            const restaurant = await Owner.findById(restaurantId);
            if (restaurant && restaurant.pushSubscriptions && restaurant.pushSubscriptions.length > 0) {
                const payload = JSON.stringify({
                    title: "🛎️ ASSISTANCE NEEDED",
                    body: `Table ${tableNumber} is calling for help!`,
                    url: `/waiter/${restaurant.username}` 
                });
                restaurant.pushSubscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(()=>{}));
            }
        } catch (e) {}
        
        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ==========================================
// ⚡ GENERAL ROUTES (MUST BE AT THE BOTTOM)
// ==========================================

// --- 6. PLACE ORDER ---
router.post('/', async (req, res) => {
    try {
        const { customerName, items, totalAmount, paymentMethod, tableNum, tableNumber, restaurantId, owner, status } = req.body;
        
        const finalTableNum = tableNum || tableNumber;
        let finalRestaurantId = restaurantId || owner;
        const finalStatus = status || "Pending"; 

        if (!finalRestaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
        if (!finalTableNum) return res.status(400).json({ message: "Table Number is required" });

        if (!mongoose.Types.ObjectId.isValid(finalRestaurantId)) {
            const restaurantOwner = await Owner.findOne({ username: finalRestaurantId });
            if (!restaurantOwner) return res.status(404).json({ message: "Restaurant not found." });
            finalRestaurantId = restaurantOwner._id;
        }

        const newOrder = new Order({ 
            customerName, 
            tableNum: finalTableNum,       
            restaurantId: finalRestaurantId, 
            items, 
            totalAmount, 
            paymentMethod,
            status: finalStatus,
            isDownloaded: false 
        });

        const savedOrder = await newOrder.save();

        if (req.io) {
            req.io.to(finalRestaurantId.toString()).emit('new-order', savedOrder);
        }

        try {
            const restaurant = await Owner.findById(finalRestaurantId);
            if (restaurant && restaurant.pushSubscriptions && restaurant.pushSubscriptions.length > 0) {
                const payload = JSON.stringify({
                    title: "🛎️ NEW ORDER RECEIVED",
                    body: `Table ${finalTableNum}: ₹${totalAmount}`,
                    url: `/chef/${restaurant.username}` 
                });

                restaurant.pushSubscriptions.forEach(sub => {
                    webpush.sendNotification(sub, payload).catch(e => console.error("Push failed for device"));
                });
            }
        } catch (pushErr) { console.error("Notification trigger failed"); }

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("Order Error:", error.message);
        res.status(400).json({ message: error.message });
    }
});

// --- 7. GET SINGLE ORDER (DYNAMIC ID ROUTE) ---
// ⚠️ This matches anything after /, so it must stay below /inbox and /calls
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Order ID format" });
        }
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 8. GET ALL ORDERS ---
router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });
        const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 9. UPDATE STATUS ---
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );

        if (!order) return res.status(404).json({ message: "Order not found" });
        
        if (req.body.status === "Served" || req.body.status === "SERVED") {
            await Owner.findByIdAndUpdate(order.restaurantId, {
                $inc: { totalRevenue: order.totalAmount }
            });
        }

        if (req.body.status === "Ready" || req.body.status === "READY") {
            const restaurant = await Owner.findById(order.restaurantId);
            if (restaurant && restaurant.pushSubscriptions?.length > 0) {
                const payload = JSON.stringify({
                    title: "🍱 ORDER READY",
                    body: `Table ${order.tableNum} is ready for pickup!`,
                    url: `/waiter/${restaurant.username}`
                });
                restaurant.pushSubscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(() => {}));
            }
        }
        
        if (req.io) {
             req.io.to(order.restaurantId.toString()).emit('order-updated', order);
             req.io.emit('order-updated', order); 
        }

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- 10. DELETE ORDER ---
router.delete('/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Order deleted" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed" });
    }
});

export default router;