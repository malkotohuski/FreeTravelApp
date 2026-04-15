const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authenticateJWT');

router.get(
  '/notifications',
  authMiddleware,
  notificationController.getNotifications,
);
router.put(
  '/notifications/read/:id',
  authMiddleware,
  notificationController.markAsRead,
);
router.patch(
  '/notifications/:id',
  authMiddleware,
  notificationController.deleteNotification,
);
router.post(
  '/notifications',
  authMiddleware,
  notificationController.createNotificationHandler,
);
router.get(
  '/conversation/:conversationId',
  authMiddleware,
  notificationController.getConversation,
);

module.exports = router;
