const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');

// Public route for sending messages
router.post('/', messageController.createMessage);

// Admin routes
router.get('/', protect, authorize('admin'), messageController.getAllMessages);
router.put('/:messageId/status', protect, authorize('admin'), messageController.updateMessageStatus);
router.delete('/:messageId', protect, authorize('admin'), messageController.deleteMessage);

module.exports = router; 