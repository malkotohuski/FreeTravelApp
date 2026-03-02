const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authenticateJWT = require('../middlewares/authenticateJWT');

router.post(
  '/start',
  authenticateJWT,
  conversationController.startConversation,
);
router.get(
  '/user/:userId',
  authenticateJWT,
  conversationController.getUserConversations,
);
router.get('/:id', authenticateJWT, conversationController.getConversationById);
router.get(
  '/:id/messages',
  authenticateJWT,
  conversationController.getMessages,
);
router.post(
  '/:id/messages',
  authenticateJWT,
  conversationController.sendMessage,
);
router.put('/:id/read', authenticateJWT, conversationController.markAsRead);
router.delete(
  '/:id',
  authenticateJWT,
  conversationController.deleteConversation,
);

module.exports = router;
