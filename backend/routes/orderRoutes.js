import express from 'express';
import mongoose from 'mongoose'; 
import webpush from 'web-push'; // Required for mobile push alerts
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
        console.log("✅ Push Notifications Initialized Successfully");
    } catch (err) {
        console.error("❌ VAPID Config Error:", err.message);
    }
} else {
    console.warn("⚠️ PUSH DISABLED: Environment variables VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY are missing.");
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

        if (publicKey && privateKey) {
            try {
                const restaurant = await Owner.findById(finalRestaurantId);
                if (restaurant && restaurant.pushSubscriptions && restaurant.pushSubscriptions.length > 0) {
                    const payload = JSON.stringify({
                        title: "🛎️ NEW ORDER RECEIVED",
                        body: `Table ${finalTableNum}: ₹${totalAmount}`,
                        url: `/chef/${restaurant.username}` 
                    });

                    restaurant.pushSubscriptions.forEach(sub => {
                        webpush.sendNotification(sub, payload).catch(e => console.error("Push failed"));
                    });
                }
            } catch (pushErr) { console.error("Notification trigger failed"); }
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("Order Error:", error.message);
        res.status(400).json({ message: error.message });
    }
});

// ✅ --- GET ALL WAITER CALLS ---
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

// ✅ --- DELETE/RESOLVE WAITER CALL ---
router.delete('/calls/:callId', async (req, res) => {
    try {
        await Call.findByIdAndDelete(req.params.callId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete call" });
    }
});

// --- 2. GET SINGLE ORDER ---
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

// --- 3. GET ALL ORDERS ---
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

// --- 4. UPDATE STATUS ---
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

        if ((req.body.status === "Ready" || req.body.status === "READY") && publicKey) {
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

// --- 5. CALL WAITER ---
router.post('/call-waiter', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type } = req.body; 
        const newCall = await Call.create({ restaurantId, tableNumber, type: type || 'help' });
        
        if (req.io) {
            req.io.to(restaurantId.toString()).emit('new-waiter-call', newCall);
        }

        if (publicKey) {
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
        }
        
        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 6. GET INBOX (FIXED) ---
router.get('/inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;

        // 🛡️ ENHANCED VALIDATION: Prevents the 400 error
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ 
                message: "A valid 24-character Restaurant ID is required." 
            });
        }

        // Search specifically for orders belonging to this ID that aren't downloaded
        const orders = await Order.find({ 
            restaurantId: restaurantId, 
            isDownloaded: false 
        }).sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error("Inbox API Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// --- 7. MARK DOWNLOADED ---
router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Valid Restaurant ID required" });
        }
        await Order.updateMany({ restaurantId, isDownloaded: false }, { $set: { isDownloaded: true } });
        res.status(200).json({ message: "Inbox cleared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear inbox" });
    }
});

// --- 8. DELETE ORDER ---
router.delete('/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Order deleted" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed" });
    }
});

export default router;