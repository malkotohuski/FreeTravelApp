const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.post('/start', conversationController.startConversation);
router.get('/user/:userId', conversationController.getUserConversations);
router.get('/:id/messages', conversationController.getMessages);
router.post('/:id/messages', conversationController.sendMessage);
router.put('/:id/read', conversationController.markAsRead);

module.exports = router;
