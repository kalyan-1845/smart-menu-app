const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// All routes require authentication
router.use(auth);

router.get('/', notificationController.getNotifications);
router.post('/mark-read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;