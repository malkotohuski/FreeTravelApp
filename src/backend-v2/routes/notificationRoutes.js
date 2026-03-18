const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authenticateJWT');

router.get(
  '/notifications',
  authMiddleware,
  notificationController.getNotifications,
);
router.put('/notifications/read/:id', notificationController.markAsRead);
router.patch('/notifications/:id', notificationController.deleteNotification);
router.post('/notifications', notificationController.createNotificationHandler); // <--- wrapper
router.get(
  '/conversation/:conversationId',
  notificationController.getConversation,
);

module.exports = router;
