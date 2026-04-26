const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {sendNotification} = require('./notificationController');
const {sendPush} = require('../services/fcmService');

const getRouteCityName = (route, key) =>
  route?.[key]?.name ||
  route?.[key === 'departureCityRef' ? 'departureCity' : 'arrivalCity'] ||
  'Unknown';

const buildConversationPayloads = conversation => {
  const convForUser1 = {
    ...conversation,
    otherUser: conversation.user2,
  };

  const convForUser2 = {
    ...conversation,
    otherUser: conversation.user1,
  };

  return {convForUser1, convForUser2};
};

// Стартиране на разговор
exports.startConversation = async (req, res) => {
  const {routeId, user2Id} = req.body;
  const user1Id = req.user.id;

  try {
    if (!user2Id) {
      return res
        .status(400)
        .json({error: 'Cannot start chat: senderId missing'});
    }

    // Проверка за съществуващ разговор
    let conversation = await prisma.conversation.findFirst({
      where: {
        routeId,
        OR: [
          {user1Id, user2Id},
          {user1Id: user2Id, user2Id: user1Id},
        ],
      },
      include: {
        messages: {orderBy: {createdAt: 'asc'}},
        user1: {select: {id: true, username: true}},
        user2: {select: {id: true, username: true}},
      },
    });

    const route = await prisma.route.findUnique({
      where: {id: routeId},
      include: {
        departureCityRef: true,
        arrivalCityRef: true,
      },
    });

    if (!route) {
      return res.status(404).json({error: 'Route not found'});
    }

    const departureCityName = getRouteCityName(route, 'departureCityRef');
    const arrivalCityName = getRouteCityName(route, 'arrivalCityRef');

    // Ако няма - създаваме
    if (!conversation) {
      // 1️⃣ създаваме conversation
      const newConversation = await prisma.conversation.create({
        data: {
          routeId,
          user1Id,
          user2Id,
          departureCity: departureCityName,
          arrivalCity: arrivalCityName,
        },
      });

      // 2️⃣ създаваме първо съобщение (ВАЖНО 🔥)
      await prisma.message.create({
        data: {
          conversationId: newConversation.id,
          senderId: user1Id, // може и req.user.id ако имаш auth
          text: `${departureCityName} - ${arrivalCityName}`,
        },
      });
      // 3️⃣ взимаме conversation с messages + image
      const fullConversation = await prisma.conversation.findUnique({
        where: {id: newConversation.id},
        include: {
          messages: {orderBy: {createdAt: 'asc'}},
          user1: {select: {id: true, username: true, userImage: true}},
          user2: {select: {id: true, username: true, userImage: true}},
        },
      });

      // 4️⃣ правим различен обект за всеки user
      const {convForUser1, convForUser2} =
        buildConversationPayloads(fullConversation);

      // 5️⃣ socket emit
      if (global.io) {
        global.io.to('user_' + user1Id).emit('newConversation', convForUser1);
        global.io.to('user_' + user2Id).emit('newConversation', convForUser2);
      }

      // важно
      conversation = fullConversation;
    }

    res.json(conversation);
  } catch (error) {
    console.error('Conversation start error:', error);
    res.status(500).json({error: 'Server error'});
  }
};

// Вземане на съобщения
exports.getMessages = async (req, res) => {
  const conversationId = Number(req.params.id);

  try {
    const conversation = await prisma.conversation.findUnique({
      where: {id: conversationId},
      select: {user1Id: true, user2Id: true},
    });

    if (!conversation) {
      return res.status(404).json({error: 'Conversation not found'});
    }

    if (![conversation.user1Id, conversation.user2Id].includes(req.user.id)) {
      return res.status(403).json({error: 'Access denied'});
    }

    const delivered = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {not: req.user.id},
        deliveredAt: null,
      },
      data: {
        deliveredAt: new Date(),
      },
    });

    if (delivered.count > 0 && global.io) {
      const otherUserId =
        conversation.user1Id === req.user.id
          ? conversation.user2Id
          : conversation.user1Id;

      global.io.to('user_' + otherUserId).emit('messagesDelivered', {
        conversationId,
        });
      }

    const messages = await prisma.message.findMany({
      where: {conversationId},
      orderBy: {createdAt: 'asc'},
    });

    return res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({error: 'Server error'});
  }
};

// Изпращане на съобщение
exports.sendMessage = async (req, res) => {
  const conversationId = Number(req.params.id);
  const {text} = req.body;
  const senderId = req.user.id;

  try {
    if (!text || !text.trim()) {
      return res.status(400).json({error: 'Message cannot be empty'});
    }
    if (text.length > 200) {
      return res.status(400).json({error: 'Message too long'});
    }

    const conversation = await prisma.conversation.findUnique({
      where: {id: conversationId},
    });

    if (!conversation) {
      return res.status(404).json({error: 'Conversation not found'});
    }

    if (![conversation.user1Id, conversation.user2Id].includes(senderId)) {
      return res.status(403).json({error: 'Access denied'});
    }

    const receiverId =
      conversation.user1Id === senderId
        ? conversation.user2Id
        : conversation.user1Id;

    // 1️⃣ Създаваме съобщението
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        text,
        read: false,
        deliveredAt: null,
      },
    });

    // 2️⃣ Emit в реално време към conversation room и user rooms
    if (global.io) {
      global.io.to('conversation_' + conversationId).emit('newMessage', {
        conversationId,
        message,
      });

      global.io.to('user_' + senderId).emit('newMessage', {
        conversationId,
        message,
      });

      global.io.to('user_' + receiverId).emit('newMessage', {
        conversationId,
        message,
      });
    }
    setImmediate(async () => {
      try {
        const userDevice = await prisma.userDevice.findFirst({
          where: {userId: receiverId},
          orderBy: {createdAt: 'desc'},
        });

        if (!userDevice?.fcmToken) {
          return;
        }

        const sender = await prisma.user.findUnique({
          where: {id: Number(senderId)},
          select: {fName: true, lName: true},
        });

        const senderName = `${sender?.fName || ''} ${
          sender?.lName || ''
        }`.trim();

        const pushResult = await sendPush(
          userDevice.fcmToken,
          senderName ? `${senderName} sent you a message` : 'New message',
          text,
          {
            screen: 'message',
            type: 'chat',
            conversationId: String(conversationId),
            senderId: String(senderId),
            messageId: String(message.id),
          },
        );

        if (
          !pushResult?.ok &&
          pushResult?.code === 'messaging/registration-token-not-registered'
        ) {
          await prisma.userDevice.deleteMany({
            where: {fcmToken: userDevice.fcmToken},
          });
          return;
        }

        if (!pushResult?.ok) {
          return;
        }

        const deliveredUpdate = await prisma.message.updateMany({
          where: {
            id: message.id,
            deliveredAt: null,
          },
          data: {
            deliveredAt: new Date(),
          },
        });

        if (deliveredUpdate.count > 0 && global.io) {
          global.io.to('user_' + senderId).emit('messagesDelivered', {
            conversationId,
            messageId: message.id,
          });
        }
      } catch (pushError) {
        console.error('Chat push delivery error:', pushError);
      }
    });
    // 3️⃣ Auto-restore conversation, ако някой е скрил
    await prisma.conversation.update({
      where: {id: conversationId},
      data: {hiddenByUser1: false, hiddenByUser2: false},
    });

    // 🔥 4️⃣ НЕ правим нотификация за чат! Просто skip
    // await sendNotification(...);  <- премахнато за chat messages

    return res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({error: 'Server error'});
  }
};

// Вземане на разговори за потребител
exports.getUserConversations = async (req, res) => {
  const skip = Number(req.query.skip) || 0;
  const take = Number(req.query.take) || 20;
  const userId = req.user.id;
  const defaultAvatar =
    'https://res.cloudinary.com/dqxczsig5/image/upload/v1774361343/avatars/bzrmewmud1dlaatajmyf.jpg';

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          {user1Id: userId, hiddenByUser1: false},
          {user2Id: userId, hiddenByUser2: false},
        ],
      },
      include: {
        messages: {
          orderBy: {createdAt: 'desc'},
          take: 1,
        },
        user1: {
          select: {id: true, username: true, userImage: true},
        },
        user2: {
          select: {id: true, username: true, userImage: true},
        },
      },
      orderBy: {createdAt: 'desc'},
      skip,
      take,
    });

    const conversationsWithExtras = await Promise.all(
      conversations.map(async conv => {
        const otherUserId =
          conv.user1Id === userId ? conv.user2Id : conv.user1Id;

        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;

        const safeOtherUser = otherUser || {
          id: otherUserId,
          username: 'Потребител',
          userImage: defaultAvatar,
        };

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: {not: userId},
            read: false,
          },
        });

        return {
          ...conv,
          otherUser: safeOtherUser,
          unreadCount,
        };
      }),
    );
    return res.json(conversationsWithExtras);
  } catch (error) {
    console.error('Get user conversations error:', error);
    return res.status(500).json({error: 'Server error'});
  }
};

// Маркиране на съобщения като прочетени
// В markAsRead
exports.markAsRead = async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = req.user.id;

  try {
    if (!conversationId || !userId) {
      return res.status(400).json({error: 'Invalid data'});
    }

    const conversation = await prisma.conversation.findUnique({
      where: {id: conversationId},
      select: {user1Id: true, user2Id: true},
    });

    if (!conversation) {
      return res.status(404).json({error: 'Conversation not found'});
    }

    if (![conversation.user1Id, conversation.user2Id].includes(userId)) {
      return res.status(403).json({error: 'Access denied'});
    }

    const updated = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {not: userId},
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
        deliveredAt: new Date(),
      },
    });

    if (global.io) {
      const otherUserId =
        conversation.user1Id === userId
          ? conversation.user2Id
          : conversation.user1Id;

      global.io.to('user_' + otherUserId).emit('messagesRead', {
        conversationId,
      });
    }

    return res.json({updatedCount: updated.count});
  } catch (error) {
    console.error('Mark messages as read error:', error);
    return res.status(500).json({error: 'Server error'});
  }
};

exports.markAsDelivered = async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = req.user.id;

  try {
    if (!conversationId || !userId) {
      return res.status(400).json({error: 'Invalid data'});
    }

    const conversation = await prisma.conversation.findUnique({
      where: {id: conversationId},
      select: {user1Id: true, user2Id: true},
    });

    if (!conversation) {
      return res.status(404).json({error: 'Conversation not found'});
    }

    if (![conversation.user1Id, conversation.user2Id].includes(userId)) {
      return res.status(403).json({error: 'Access denied'});
    }

    const updated = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {not: userId},
        deliveredAt: null,
      },
      data: {
        deliveredAt: new Date(),
      },
    });

    if (updated.count > 0 && global.io) {
      const otherUserId =
        conversation.user1Id === userId
          ? conversation.user2Id
          : conversation.user1Id;

      global.io.to('user_' + otherUserId).emit('messagesDelivered', {
        conversationId,
      });
    }

    return res.json({updatedCount: updated.count});
  } catch (error) {
    console.error('Mark messages as delivered error:', error);
    return res.status(500).json({error: 'Server error'});
  }
};

exports.deleteConversation = async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = req.user.id; // идва от твоя JWT middleware

  try {
    const conversation = await prisma.conversation.findUnique({
      where: {id: conversationId},
    });

    if (!conversation) {
      return res.status(404).json({error: 'Conversation not found'});
    }

    // Проверяваме кой потребител изтрива
    let updateData = {};
    if (conversation.user1Id === userId) {
      updateData.hiddenByUser1 = true;
    } else if (conversation.user2Id === userId) {
      updateData.hiddenByUser2 = true;
    } else {
      return res
        .status(403)
        .json({error: 'You are not part of this conversation'});
    }

    // Актуализираме soft delete флага
    await prisma.conversation.update({
      where: {id: conversationId},
      data: updateData,
    });

    return res.json({success: true});
  } catch (err) {
    console.error('Delete conversation failed:', err);
    return res.status(500).json({error: 'Failed to delete conversation'});
  }
};

exports.getConversationById = async (req, res) => {
  const conversationId = Number(req.params.id);

  try {
    const conversation = await prisma.conversation.findUnique({
      where: {id: conversationId},
      select: {
        id: true,
        departureCity: true,
        arrivalCity: true,
        user1Id: true,
        user2Id: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({error: 'Conversation not found'});
    }

    if (![conversation.user1Id, conversation.user2Id].includes(req.user.id)) {
      return res.status(403).json({error: 'Access denied'});
    }

    return res.json({
      id: conversation.id,
      departureCity: conversation.departureCity,
      arrivalCity: conversation.arrivalCity,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({error: 'Server error'});
  }
};




