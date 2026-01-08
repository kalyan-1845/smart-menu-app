import express from 'express';
import webpush from 'web-push'; 
import Owner from '../models/Owner.js';
import { createCall, getCalls, resolveCall } from '../controllers/notificationController.js';

const router = express.Router();

// --- 🔑 WEB PUSH CONFIG ---
webpush.setVapidDetails(
    'mailto:support@kovixa.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * 📱 MOBILE PUSH WRAPPER
 * This executes your existing controller but also sends a 
 * push notification to wake up mobile devices.
 */
const handleStaffNotify = async (req, res) => {
    // 1. Run your existing controller (Socket.io + Database Save)
    await createCall(req, res);

    // 2. 🚀 Trigger Mobile Push Alert
    try {
        const { restaurantId, tableNumber } = req.body;
        const restaurant = await Owner.findById(restaurantId);

        if (restaurant && restaurant.pushSubscriptions?.length > 0) {
            const payload = JSON.stringify({
                title: "🛎️ WAITER CALLED",
                body: `Table ${tableNumber} is requesting assistance!`,
                url: `/waiter/${restaurant.username}` 
            });

            // Loop through all registered mobile devices for this restaurant
            restaurant.pushSubscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(e => console.log("Push: Device offline"));
            });
        }
    } catch (err) {
        console.error("Staff Push notification failed");
    }
};

// ✅ Route 1: Matches frontend's Primary attempt: "/broadcast/notify"
router.post('/notify', handleStaffNotify);

// ✅ Route 2: Matches frontend's Fallback attempt: "/notification/send"
router.post('/send', handleStaffNotify);

// ✅ Standard CRUD routes for Dashboard (Kept Unchanged)
router.get('/', getCalls);
router.delete('/:id', resolveCall);

export default router;