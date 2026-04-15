const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {sendPush} = require('../services/fcmService');
const {isUserOnline} = require('../utils/onlineUsers');

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
    throw new Error('recipientId, senderId and message are required');
  }

  if (type === 'message') {
    return null;
  }

  const existing = await prisma.notification.findFirst({
    where: {
      recipientId: Number(recipientId),
      routeId,
      message,
      status: 'active',
    },
  });

  const getNotificationTitle = (notificationType, senderName = '') => {
    switch (notificationType) {
      case 'message':
        return senderName ? `📩 ${senderName} ти писа` : '📩 Ново съобщение';
      case 'request':
        return '🚗 Нова заявка за пътуване';
      case 'accept':
        return '✅ Заявката ти е приета';
      case 'reject':
        return '❌ Заявката ти е отказана';
      case 'rating':
        return '⭐ Получи нова оценка';
      default:
        return '🔔 Ново известие';
    }
  };

  const pushToUser = async () => {
    const userDevice = await prisma.userDevice.findFirst({
      where: {userId: Number(recipientId)},
      orderBy: {createdAt: 'desc'},
    });

    const isOnline = isUserOnline(recipientId);

    if (!skipPushIfOnline || !isOnline) {
      if (userDevice?.fcmToken) {
        let senderName = '';
        try {
          const sender = await prisma.user.findUnique({
            where: {id: Number(senderId)},
            select: {fName: true, lName: true},
          });
          senderName = `${sender?.fName || ''} ${sender?.lName || ''}`.trim();
        } catch (error) {
          console.warn('Sender lookup failed:', error.message);
        }

        const title = getNotificationTitle(type, senderName);
        const stringifiedData = {};

        for (const key in data) {
          stringifiedData[key] = String(data[key] ?? '');
        }

        await sendPush(userDevice.fcmToken, title, message, {
          screen: type === 'chat' ? 'message' : type,
          type: String(type || ''),
          routeId: String(routeId || ''),
          conversationId: conversationId ? String(conversationId) : '',
          message: String(message || ''),
          senderName: String(senderName || ''),
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

exports.createNotificationHandler = async (req, res) => {
  try {
    const {recipientId, message, routeId, personalMessage, requester, conversationId, skipPushIfOnline, type, data} = req.body;

    if (!recipientId || !message) {
      return res.status(400).json({error: 'recipientId and message are required'});
    }

    const notification = await exports.sendNotification({
      recipientId,
      senderId: req.user.id,
      message,
      routeId,
      personalMessage,
      requester,
      conversationId,
      skipPushIfOnline,
      type,
      data,
    });

    return res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    return res.status(500).json({error: 'Failed to create notification'});
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: {recipientId: userId, status: 'active'},
      orderBy: {createdAt: 'desc'},
      include: {sender: {select: {id: true, username: true}}},
    });

    const routeIds = [
      ...new Set(
        notifications.map(notification => notification.routeId).filter(Boolean),
      ),
    ];

    const routes = routeIds.length
      ? await prisma.route.findMany({
          where: {id: {in: routeIds}},
          include: {
            departureCityRef: true,
            arrivalCityRef: true,
          },
        })
      : [];

    const routeMap = new Map(routes.map(route => [route.id, route]));

    const formatted = notifications.map(notification => {
      const route = routeMap.get(notification.routeId);

      return {
        id: notification.id,
        message: notification.message,
        routeId: notification.routeId,
        recipientId: notification.recipientId,
        conversationId: notification.conversationId,
        departureCityId: route?.departureCityId || null,
        departureCity:
          route?.departureCityRef?.name || route?.departureCity || null,
        arrivalCityId: route?.arrivalCityId || null,
        arrivalCity: route?.arrivalCityRef?.name || route?.arrivalCity || null,
        senderId: notification.senderId,
        senderUsername: notification.sender?.username || null,
        read: notification.read,
        status: notification.status,
        createdAt: notification.createdAt,
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: 'Failed to fetch notifications'});
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: {id: notificationId},
      select: {id: true, recipientId: true},
    });

    if (!notification || notification.recipientId !== req.user.id) {
      return res.status(404).json({error: 'Notification not found'});
    }

    await prisma.notification.update({
      where: {id: notificationId},
      data: {read: true},
    });

    return res.json({message: 'Notification marked as read'});
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: 'Failed to update notification'});
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: {id: notificationId},
      select: {id: true, recipientId: true},
    });

    if (!notification || notification.recipientId !== req.user.id) {
      return res.status(404).json({error: 'Notification not found'});
    }

    const updatedNotification = await prisma.notification.update({
      where: {id: notificationId},
      data: {status: 'deleted'},
    });

    return res.status(200).json(updatedNotification);
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return res.status(500).json({error: 'Failed to delete notification'});
  }
};

exports.getConversation = async (req, res) => {
  try {
    const {conversationId} = req.params;
    const messages = await prisma.notification.findMany({
      where: {conversationId, status: 'active'},
      orderBy: {createdAt: 'asc'},
    });

    const canAccessConversation = messages.some(message => {
      return (
        message.recipientId === req.user.id ||
        message.senderId === req.user.id
      );
    });

    if (!canAccessConversation) {
      return res.status(403).json({error: 'Access denied'});
    }

    return res.json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: 'Failed to fetch conversation'});
  }
};
