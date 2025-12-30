const express = require('express');
const router = express.Router();
const { auth, isSuperAdmin } = require('../middleware/auth');
const broadcastController = require('./controllers/broadcastController');

// All routes require authentication
router.use(auth);

// Only super admin can create/update/delete broadcasts
router.post('/', isSuperAdmin, broadcastController.createBroadcast);
router.put('/:id', isSuperAdmin, broadcastController.updateBroadcast);
router.delete('/:id', isSuperAdmin, broadcastController.deleteBroadcast);

// All authenticated users can view broadcasts
router.get('/', broadcastController.getBroadcasts);

module.exports = router;