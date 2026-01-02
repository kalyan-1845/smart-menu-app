import express from 'express';
import mongoose from 'mongoose'; 
import webpush from 'web-push'; 
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

// --- 🔑 SAFE WEB PUSH CONFIGURATION ---
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails(
            'mailto:support@bitebox.com',
            publicKey,
            privateKey
        );
        console.log("✅ Order Routes: Push Initialized");
    } catch (err) {
        console.error("❌ Order Routes VAPID Error:", err.message);
    }
} else {
    console.warn("⚠️ Order Routes: Skipping VAPID (Keys missing)");
}

// --- 1. PLACE ORDER ---
router.post('/', async (req, res) => {
    try {
        const { customerName, items, totalAmount, paymentMethod, tableNum, tableNumber, restaurantId, owner, status } = req.body;
        
        const finalTableNum = tableNum || tableNumber;
        let finalRestaurantId = restaurantId || owner;
        const finalStatus = status || "Pending"; 

        if (!finalRestaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
        if (!finalTableNum) return res.status(400).json({ message: "Table Number is required" });

        // Resolve ID if username was passed
        if (!mongoose.Types.ObjectId.isValid(finalRestaurantId)) {
            const restaurantOwner = await Owner.findOne({ username: finalRestaurantId.toLowerCase() });
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

        // 📡 Emit only to the specific restaurant room
        if (req.io) {
            req.io.to(finalRestaurantId.toString()).emit('new-order', savedOrder);
        }

        // Safe Notification Trigger
        try {
            if (publicKey && privateKey) {
                const restaurant = await Owner.findById(finalRestaurantId);
                if (restaurant && restaurant.pushSubscriptions?.length > 0) {
                    const payload = JSON.stringify({
                        title: "🛎️ NEW ORDER RECEIVED",
                        body: `Table ${finalTableNum}: ₹${totalAmount}`,
                        url: `/chef/${restaurant.username}` 
                    });

                    restaurant.pushSubscriptions.forEach(sub => {
                        webpush.sendNotification(sub, payload).catch(() => {});
                    });
                }
            }
        } catch (pushErr) { console.error("Notification trigger failed"); }

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ✅ --- 2. GET ALL WAITER CALLS (HISTORY) ---
router.get('/calls', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }
        const calls = await Call.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ✅ --- 3. GET GLOBAL ORDER COUNT (For SuperAdmin) ---
router.get('/all-count', async (req, res) => {
    try {
        const count = await Order.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ count: 0 });
    }
});

// --- 4. GET ALL ORDERS (CHEF/WAITER VIEW) ---
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

// --- 5. DELETE/RESOLVE WAITER CALL ---
router.delete('/calls/:callId', async (req, res) => {
    try {
        await Call.findByIdAndDelete(req.params.callId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete call" });
    }
});

// --- 6. UPDATE STATUS (CHEF ACTIONS) ---
router.put('/:id', async (req, res) => {
    try {
        const oldOrder = await Order.findById(req.params.id);
        if (!oldOrder) return res.status(404).json({ message: "Order not found" });

        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );

        // 💰 REVENUE LOGIC: Only increment if status changes to Served and wasn't Served before
        if ((req.body.status.toLowerCase() === "served") && oldOrder.status.toLowerCase() !== "served") {
            await Owner.findByIdAndUpdate(order.restaurantId, {
                $inc: { totalRevenue: order.totalAmount }
            });
        }

        // 🍱 READY NOTIFICATION
        if ((req.body.status.toLowerCase() === "ready") && publicKey && privateKey) {
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
        }

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- 7. CALL WAITER ---
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body; 
        const newCall = await Call.create({ restaurantId, tableNumber, type: type || 'help' });
        
        if (req.io) {
            req.io.to(restaurantId.toString()).emit('new-waiter-call', newCall);
        }

        try {
            if (publicKey && privateKey) {
                const restaurant = await Owner.findById(restaurantId);
                if (restaurant && restaurant.pushSubscriptions?.length > 0) {
                    const payload = JSON.stringify({
                        title: "🛎️ ASSISTANCE NEEDED",
                        body: `Table ${tableNumber} is calling for help!`,
                        url: `/waiter/${restaurant.username}` 
                    });
                    restaurant.pushSubscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(()=>{}));
                }
            }
        } catch (e) {}
        
        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 8. CLEAR INBOX ---
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });
        await Order.updateMany({ restaurantId, isDownloaded: false }, { $set: { isDownloaded: true } });
        res.status(200).json({ message: "Inbox cleared" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear inbox" });
    }
});

// --- 9. GET SINGLE ORDER ---
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 10. DELETE ORDER ---
router.delete('/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Delete failed" });
    }
});

export default router;