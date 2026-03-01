const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

// Вземане на notifications по username
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
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
// Mark as read
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
    // Взимаме нотификацията и маркираме статус като 'deleted'
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
      where: {
        conversationId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to fetch conversation'});
  }
};

exports.createNotification = async (req, res) => {
  try {
    const {
      recipientId,
      message,
      routeId,
      personalMessage,
      requester,
      conversationId,
      senderId,
    } = req.body;

    const notification = await prisma.notification.create({
      data: {
        recipientId: Number(recipientId),
        message,
        routeId,
        personalMessage: personalMessage || null,
        requester: requester || null,
        conversationId: conversationId || null,
        read: false,
        status: 'active',
        createdAt: new Date(),
        senderId: Number(senderId),
      },
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({error: 'Failed to create notification'});
  }
};
