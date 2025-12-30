import express from 'express';
import { createCall, getCalls, resolveCall } from '../controllers/notificationController.js';

const router = express.Router();

// ✅ Route 1: Matches frontend's Primary attempt: "/broadcast/notify"
router.post('/notify', createCall);

// ✅ Route 2: Matches frontend's Fallback attempt: "/notification/send"
router.post('/send', createCall);

// ✅ Standard CRUD routes for Dashboard
router.get('/', getCalls);
router.delete('/:id', resolveCall);

export default router;