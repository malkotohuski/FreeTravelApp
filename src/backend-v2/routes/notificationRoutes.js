const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/notifications/:username', notificationController.getNotifications);
router.put('/notifications/read/:id', notificationController.markAsRead);
router.patch('/notifications/:id', notificationController.deleteNotification);
router.post('/notifications', notificationController.createNotification);
router.get(
  '/conversation/:conversationId',
  notificationController.getConversation,
);

module.exports = router;
