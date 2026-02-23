const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

// Вземане на notifications по username
exports.getNotifications = async (req, res) => {
  try {
    const {username} = req.params;

    const notifications = await prisma.notification.findMany({
      where: {
        recipient: username,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(notifications);
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
