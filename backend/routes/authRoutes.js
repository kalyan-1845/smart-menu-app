import express from 'express';
import { 
    registerOwner, 
    loginOwner, 
    getOwnerIdByUsername, 
    getRestaurantDetails,
    saveSubscription 
} from '../controllers/authController.js'; // ✅ Imports the functions above

const router = express.Router();

router.post('/register', registerOwner);
router.post('/login', loginOwner);
router.get('/owner-id/:username', getOwnerIdByUsername);
router.get('/restaurant/:id', getRestaurantDetails);
router.post('/save-subscription', saveSubscription);

export default router;