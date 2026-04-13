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

  // 🔥 Пропускаме чат съобщения → няма да се добавят в Notifications
  if (type === 'message') return;

  // 🔹 Проверка за дублираща нотификация
  const existing = await prisma.notification.findFirst({
    where: {
      recipientId: Number(recipientId),
      routeId,
      message,
      status: 'active',
    },
  });

  const getNotificationTitle = (type, senderName = '') => {
    switch (type) {
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
        } catch (e) {
          console.log('Sender fetch error:', e.message);
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

    const formatted = notifications.map(n => {
      const route = routeMap.get(n.routeId);

      return {
        id: n.id,
        message: n.message,
        routeId: n.routeId,
        recipientId: n.recipientId,
        conversationId: n.conversationId,
        departureCityId: route?.departureCityId || null,
        departureCity:
          route?.departureCityRef?.name || route?.departureCity || null,
        arrivalCityId: route?.arrivalCityId || null,
        arrivalCity: route?.arrivalCityRef?.name || route?.arrivalCity || null,
        senderId: n.senderId,
        senderUsername: n.sender?.username || null,
        read: n.read,
        status: n.status,
        createdAt: n.createdAt,
      };
    });

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
