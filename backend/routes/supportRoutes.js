import express from 'express';
import { createTicket, getAllTickets, replyToTicket } from '../controllers/supportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Super Admin Route: Get all tickets
router.get('/all', protect, getAllTickets);

// Owner Route: Create a new ticket
router.post('/create', protect, createTicket);

// Shared Route: Reply to a ticket
router.post('/reply/:id', protect, replyToTicket);

export default router;