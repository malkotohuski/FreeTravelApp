const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/notifications/:username', notificationController.getNotifications);
router.put('/notifications/read/:id', notificationController.markAsRead);
router.patch('/notifications/:id', notificationController.deleteNotification);

module.exports = router;
