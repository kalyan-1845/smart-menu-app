import express from 'express';
import { getCEOStats, toggleFeature, updateNotes, ghostLogin, sendBroadcast } from '../controllers/superAdminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/ceo-sync', protect, getCEOStats);
router.put('/control/:ownerId', protect, toggleFeature);
router.put('/notes/:ownerId', protect, updateNotes);
router.get('/ghost-login/:ownerId', protect, ghostLogin);
router.post('/broadcast', protect, sendBroadcast);

export default router;