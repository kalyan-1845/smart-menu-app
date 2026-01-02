import express from 'express';
import mongoose from 'mongoose'; 
import webpush from 'web-push'; 
import Order from '../models/Order.js';
import Call from '../models/Call.js'; 
import Owner from '../models/Owner.js'; 

const router = express.Router();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails('mailto:support@bitebox.com', publicKey, privateKey);
        console.log("✅ Push Notifications Initialized");
    } catch (err) { console.error("❌ VAPID Config Error:", err.message); }
}

router.post('/', async (req, res) => {
    try {
        const { customerName, items, totalAmount, paymentMethod, tableNum, tableNumber, restaurantId, owner, status } = req.body;
        const finalTableNum = tableNum || tableNumber;
        let finalRestaurantId = restaurantId || owner;
        const finalStatus = status || "Pending"; 

        if (!finalRestaurantId || !finalTableNum) return res.status(400).json({ message: "ID and Table required" });

        if (!mongoose.Types.ObjectId.isValid(finalRestaurantId)) {
            const restaurantOwner = await Owner.findOne({ username: finalRestaurantId });
            if (!restaurantOwner) return res.status(404).json({ message: "Restaurant not found." });
            finalRestaurantId = restaurantOwner._id;
        }

        const newOrder = new Order({ 
            customerName, tableNum: finalTableNum, restaurantId: finalRestaurantId, 
            items, totalAmount, paymentMethod, status: finalStatus, isDownloaded: false 
        });

        const savedOrder = await newOrder.save();
        if (req.io) req.io.to(finalRestaurantId.toString()).emit('new-order', savedOrder);

        if (publicKey && privateKey) {
            try {
                const restaurant = await Owner.findById(finalRestaurantId);
                if (restaurant?.pushSubscriptions?.length > 0) {
                    const payload = JSON.stringify({
                        title: "🛎️ NEW ORDER RECEIVED",
                        body: `Table ${finalTableNum}: ₹${totalAmount}`,
                        url: `/chef/${restaurant.username}` 
                    });
                    restaurant.pushSubscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(() => {}));
                }
            } catch (e) {}
        }
        res.status(201).json(savedOrder);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// ✅ FIXED INBOX ROUTE: Robust Validation to Stop 400 Errors
router.get('/inbox', async (req, res) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "A valid 24-character ID is required." });
        }

        const orders = await Order.find({ restaurantId, isDownloaded: false }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) return res.status(400).json({ message: "Valid ID required" });
        await Order.updateMany({ restaurantId, isDownloaded: false }, { $set: { isDownloaded: true } });
        res.status(200).json({ message: "Inbox cleared" });
    } catch (error) { res.status(500).json({ error: "Failed to clear" }); }
});

router.get('/calls', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) return res.status(400).json({ message: "Invalid ID" });
        const calls = await Call.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(calls);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete('/calls/:callId', async (req, res) => {
    try {
        await Call.findByIdAndDelete(req.params.callId);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Failed delete" }); }
});

router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid format" });
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Not found" });
        res.json(order);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "ID required" });
        const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (!order) return res.status(404).json({ message: "Not found" });
        
        if (req.body.status === "Served" || req.body.status === "SERVED") {
            await Owner.findByIdAndUpdate(order.restaurantId, { $inc: { totalRevenue: order.totalAmount } });
        }
        if (req.io) req.io.to(order.restaurantId.toString()).emit('order-updated', order);
        res.json(order);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted" });
    } catch (error) { res.status(500).json({ message: "Delete failed" }); }
});

export default router;