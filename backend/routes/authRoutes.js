import express from 'express';
import { 
    registerOwner, 
    loginOwner, 
    getOwnerIdByUsername, 
    getRestaurantDetails,
    saveSubscription 
} from '../controllers/authController.js'; // ✅ Imports from your new file

const router = express.Router();

// --- AUTH ROUTES ---
router.post('/register', registerOwner);
router.post('/login', loginOwner);

// --- UTILITY ROUTES ---
router.get('/owner-id/:username', getOwnerIdByUsername);
router.get('/restaurant/:id', getRestaurantDetails);

// --- NOTIFICATION ROUTES ---
router.post('/save-subscription', saveSubscription);

export default router;