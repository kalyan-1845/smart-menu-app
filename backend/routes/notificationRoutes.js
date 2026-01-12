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
 * 📱 OWNER NOTIFICATION WRAPPER
 * This saves the call to the DB and sends a Push Notification
 * directly to the Restaurant Owner's device.
 */
const handleStaffNotify = async (req, res) => {
    // 1. Run your existing controller (Socket.io + Database Save)
    // We await this to ensure the call exists before notifying
    await createCall(req, res);

    // 2. 🚀 Trigger Mobile Push Alert to Owner
    try {
        const { restaurantId, tableNumber } = req.body;
        
        // Find the Owner by ID
        const restaurant = await Owner.findById(restaurantId);

        if (restaurant && restaurant.pushSubscriptions?.length > 0) {
            const payload = JSON.stringify({
                title: "🛎️ CUSTOMER CALLING",
                body: `Table ${tableNumber} requires assistance!`,
                // ✅ UPDATED: Redirects to Admin Panel (since Waiter Panel is deleted)
                url: `/${restaurant.username}/admin?tab=orders` 
            });

            // Loop through all registered mobile devices for this owner
            restaurant.pushSubscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload)
                    .catch(e => console.log(`Push failed for device: ${e.message}`));
            });
        }
    } catch (err) {
        console.error("Owner Push notification failed:", err.message);
    }
};

// ✅ Route 1: Matches frontend's Primary attempt
router.post('/notify', handleStaffNotify);

// ✅ Route 2: Matches frontend's Fallback attempt
router.post('/send', handleStaffNotify);

// ✅ Standard CRUD routes for Dashboard List
router.get('/', getCalls);
router.delete('/:id', resolveCall);

export default router;