const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const supportController = require('../controllers/supportController');

// All routes require authentication
router.use(auth);

router.post('/', supportController.createTicket);
router.get('/', supportController.getTickets);
router.get('/:id', supportController.getTicket);
router.post('/:id/message', supportController.addMessage);
router.patch('/:id/status', supportController.updateTicketStatus);

module.exports = router;