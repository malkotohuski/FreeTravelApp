const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {sendPush} = require('../services/fcmService');
const {isUserOnline} = require('../utils/onlineUsers');

/**
 * Helper function за създаване на нотификация и push
 */
exports.sendNotification = async ({
  recipientId,
  senderId,
  message,
  routeId,
  personalMessage = null,
  requester = null,
  conversationId = null,
  skipPushIfOnline = false,
  type = 'generic',
  data = {},
}) => {
  if (!recipientId || !senderId || !message) {
    throw new Error('recipientId, senderId и message са задължителни');
  }

  const existing = await prisma.notification.findFirst({
    where: {
      recipientId: Number(recipientId),
      routeId,
      message,
      status: 'active',
    },
  });

  const pushToUser = async () => {
    const userDevice = await prisma.userDevice.findFirst({
      where: {userId: Number(recipientId)},
      orderBy: {createdAt: 'desc'},
    });

    const isOnline = isUserOnline(recipientId);
    if (!skipPushIfOnline || !isOnline) {
      if (userDevice?.fcmToken) {
        console.log('Sending push to token:', userDevice.fcmToken);
        console.log(
          'Sending push to userId:',
          recipientId,
          'token:',
          userDevice?.fcmToken,
        );
        const stringifiedData = {};
        for (const key in data) {
          stringifiedData[key] = String(data[key] ?? '');
        }

        await sendPush(userDevice.fcmToken, 'Нова нотификация', message, {
          type: String(type || ''),
          routeId: String(routeId || ''),
          conversationId: String(conversationId || ''),
          ...stringifiedData,
        });
      }
    }
  };

  if (existing) {
    await pushToUser();
    return existing;
  }

  const notification = await prisma.notification.create({
    data: {
      recipientId: Number(recipientId),
      senderId: Number(senderId),
      message,
      routeId,
      personalMessage,
      requester,
      conversationId: conversationId ? String(conversationId) : null,
      read: false,
      status: 'active',
      createdAt: new Date(),
    },
  });

  if (global.io) {
    global.io.to('user_' + recipientId).emit('newNotification', notification);
  }

  await pushToUser();
  return notification;
};

/**
 * Express wrapper за createNotification
 */
exports.createNotificationHandler = async (req, res) => {
  try {
    const notification = await exports.sendNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({error: 'Failed to create notification'});
  }
};

// Останалите endpoints
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: {recipientId: userId, status: 'active'},
      orderBy: {createdAt: 'desc'},
      include: {sender: {select: {id: true, username: true}}},
    });

    const formatted = notifications.map(n => ({
      id: n.id,
      message: n.message,
      routeId: n.routeId,
      senderId: n.senderId,
      senderUsername: n.sender?.username || null,
      read: n.read,
      status: n.status,
      createdAt: n.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to fetch notifications'});
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const {id} = req.params;
    await prisma.notification.update({
      where: {id: Number(id)},
      data: {read: true},
    });
    res.json({message: 'Notification marked as read'});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to update notification'});
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const {id} = req.params;
    const notification = await prisma.notification.update({
      where: {id: Number(id)},
      data: {status: 'deleted'},
    });
    res.status(200).json(notification);
  } catch (error) {
    console.error('Failed to delete notification:', error);
    res.status(500).json({error: 'Failed to delete notification'});
  }
};

exports.getConversation = async (req, res) => {
  try {
    const {conversationId} = req.params;
    const messages = await prisma.notification.findMany({
      where: {conversationId, status: 'active'},
      orderBy: {createdAt: 'asc'},
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to fetch conversation'});
  }
};
