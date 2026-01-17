import express from 'express';
import { 
    registerOwner, 
    loginOwner, 
    getOwnerIdByUsername, 
    getRestaurantDetails,
    saveSubscription 
} from '../controllers/authController.js';

const router = express.Router();

// 🔐 AUTH
router.post('/register', registerOwner);
router.post('/login', loginOwner);

// 🔗 QR CODE LINKING (Crucial)
// The frontend calls this: /api/auth/owner-id/burger-king
router.get('/owner-id/:username', getOwnerIdByUsername);

// 🏠 RESTAURANT INFO
router.get('/restaurant/:id', getRestaurantDetails);

// 🔔 NOTIFICATIONS
router.post('/save-subscription', saveSubscription);

export default router;