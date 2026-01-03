import express from 'express';
import { 
    getCEOStats, 
    toggleFeature, 
    updateNotes, 
    ghostLogin, 
    sendBroadcast,
    getMaintenanceStatus, 
    toggleMaintenance     
} from '../controllers/superAdminController.js';

// ✅ MOCK MIDDLEWARE: Keeps the app from crashing if you don't have authMiddleware yet.
// If you DO have authMiddleware.js, you can uncomment the import below.
// import { protect } from '../middleware/authMiddleware.js'; 
const protect = (req, res, next) => next(); 

const router = express.Router();

// --- DEFINE ROUTES ---
router.get('/ceo-sync', protect, getCEOStats);
router.put('/control/:ownerId', protect, toggleFeature);
router.put('/notes/:ownerId', protect, updateNotes);
router.get('/ghost-login/:ownerId', protect, ghostLogin);
router.post('/broadcast', protect, sendBroadcast);

// 👇 THE MISSING ROUTES (Fixes the 404 error)
router.get('/maintenance-status', getMaintenanceStatus);
router.post('/toggle-maintenance', protect, toggleMaintenance);

// ✅ THIS IS THE CRITICAL LINE YOU WERE MISSING
export default router;