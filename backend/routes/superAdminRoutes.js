import express from 'express';
import { 
    getCEOStats, 
    toggleFeature, 
    updateNotes, 
    ghostLogin, 
    sendBroadcast,
    getMaintenanceStatus, // 👈 New Import
    toggleMaintenance     // 👈 New Import
} from '../controllers/superAdminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/ceo-sync', protect, getCEOStats);
router.put('/control/:ownerId', protect, toggleFeature);
router.put('/notes/:ownerId', protect, updateNotes);
router.get('/ghost-login/:ownerId', protect, ghostLogin);
router.post('/broadcast', protect, sendBroadcast);

// 👇 THE MISSING ROUTES FOR YOUR 404 ERROR 👇
router.get('/maintenance-status', getMaintenanceStatus); // Public read is okay for checking status
router.post('/toggle-maintenance', protect, toggleMaintenance);

export default router;