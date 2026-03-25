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

  // 🔹 Проверка за дублираща нотификация
  const existing = await prisma.notification.findFirst({
    where: {
      recipientId: Number(recipientId),
      routeId,
      message,
      status: 'active',
    },
  });

  // 🔹 Функция за title според type
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

  // 🔹 Изпращане на push
  const pushToUser = async () => {
    const devices = await prisma.userDevice.findMany({
      where: {userId: Number(recipientId)},
    });

    // ⚡️ Уникализиране по fcmToken, за да не се дублират пушове
    const uniqueDevices = Array.from(
      new Map(devices.map(d => [d.fcmToken, d])).values(),
    );

    const isOnline = isUserOnline(recipientId);

    const isInSameChat = global.isUserInConversation(
      recipientId,
      conversationId,
    );

    console.log('🧠 CHECK:', {
      isOnline,
      isInSameChat,
    });

    // ❌ ако е в същия чат → НЕ пращай push
    if (conversationId && isInSameChat) {
      console.log('🔕 USER IN CHAT → NO PUSH');
      return;
    }

    if (!skipPushIfOnline || !isOnline) {
      for (const device of uniqueDevices) {
        if (device?.fcmToken) {
          console.log('📲 Sending push to device:', device.fcmToken);

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

          console.log('📨 PUSH DATA:', {
            screen: type || '',
            type: String(type || ''),
            routeId: routeId ? String(routeId) : '',
            conversationId: conversationId ? String(conversationId) : '',
            senderId: String(senderId),
            recipientId: String(recipientId),
            ...stringifiedData,
          });

          await sendPush(device.fcmToken, title, message, {
            screen: type || '',
            type: String(type || ''),
            routeId: routeId ? String(routeId) : '',
            conversationId: conversationId ? String(conversationId) : '',
            senderId: String(senderId),
            recipientId: String(recipientId),
            ...stringifiedData,
          });
        }
      }
    }
  };

  // 🔹 Ако вече има такава нотификация
  if (existing) {
    await pushToUser();
    return existing;
  }

  // 🔹 Създаване в базата
  const notification = await prisma.notification.create({
    data: {
      recipientId: Number(recipientId),
      senderId: Number(senderId),
      message,
      routeId: routeId ? String(routeId) : null,
      personalMessage,
      requester,
      conversationId: conversationId ? String(conversationId) : null,
      read: false,
      status: 'active',
      createdAt: new Date(),
    },
  });

  // 🔹 Socket emit (real-time)
  if (global.io) {
    global.io.to('user_' + recipientId).emit('newNotification', notification);
  }

  // 🔹 Push
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
