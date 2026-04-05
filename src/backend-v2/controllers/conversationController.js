const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {sendNotification} = require('./notificationController');

// Стартиране на разговор
exports.startConversation = async (req, res) => {
  const {routeId, user1Id, user2Id} = req.body;

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
    });

    if (!route) {
      return res.status(404).json({error: 'Route not found'});
    }

    // Ако няма → създаваме
    if (!conversation) {
      // 1️⃣ създаваме conversation
      const newConversation = await prisma.conversation.create({
        data: {
          routeId,
          user1Id,
          user2Id,
          departureCity: route.departureCity,
          arrivalCity: route.arrivalCity,
        },
      });

      // 2️⃣ създаваме първо съобщение (ВАЖНО 🔥)
      await prisma.message.create({
        data: {
          conversationId: newConversation.id,
          senderId: user1Id, // може и req.user.id ако имаш auth
          text: `${route.departureCity} → ${route.arrivalCity}`,
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
      const convForUser1 = {
        ...fullConversation,
        otherUser: fullConversation.user2,
      };

      const convForUser2 = {
        ...fullConversation,
        otherUser: fullConversation.user1,
      };

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
    const messages = await prisma.message.findMany({
      where: {conversationId},
      orderBy: {createdAt: 'asc'},
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({error: 'Server error'});
  }
};

// Изпращане на съобщение
exports.sendMessage = async (req, res) => {
  const conversationId = Number(req.params.id);
  const {senderId, text} = req.body;

  try {
    if (!text || !text.trim()) {
      return res.status(400).json({error: 'Message cannot be empty'});
    }
    if (text.length > 200) {
      return res.status(400).json({error: 'Message too long'});
    }

    // 1️⃣ Създаваме съобщението
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        text,
        read: false, // важно
      },
    });

    const conversation = await prisma.conversation.findUnique({
      where: {id: conversationId},
    });

    if (!conversation) {
      return res.status(404).json({error: 'Conversation not found'});
    }

    const receiverId =
      conversation.user1Id === senderId
        ? conversation.user2Id
        : conversation.user1Id;

    // 2️⃣ Emit в реално време
    if (global.io) {
      global.io.to('conversation_' + conversationId).emit('newMessage', {
        conversationId,
        message,
      });
    }

    // 3️⃣ Auto-restore conversation, ако някой е скрил
    await prisma.conversation.update({
      where: {id: conversationId},
      data: {hiddenByUser1: false, hiddenByUser2: false},
    });

    // 4️⃣ Вземаме името на подателя
    const sender = await prisma.user.findUnique({
      where: {id: senderId},
      select: {username: true},
    });

    // 5️⃣ Създаваме push notification
    await sendNotification({
      recipientId: receiverId,
      senderId,
      message: text,
      conversationId: conversationId,
      type: 'message',
      data: {
        type: 'message',
        conversationId: conversationId,
        message: text,
      },
      skipPushIfOnline: true,
    });

    res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({error: 'Server error'});
  }
};

// Вземане на разговори за потребител
exports.getUserConversations = async (req, res) => {
  const skip = Number(req.query.skip) || 0;
  const take = Number(req.query.take) || 20;
  const userId = Number(req.params.userId);
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
    res.json(conversationsWithExtras);
  } catch (error) {
    console.error('Get user conversations error:', error);
    res.status(500).json({error: 'Server error'});
  }
};

// Маркиране на съобщения като прочетени
// В markAsRead
exports.markAsRead = async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = Number(req.body.userId);

  try {
    if (!conversationId || !userId) {
      return res.status(400).json({error: 'Invalid data'});
    }

    const unreadBefore = await prisma.message.findMany({
      where: {conversationId, senderId: {not: userId}, read: false},
      select: {id: true, text: true},
    });
    console.log(
      '📌 Unread messages BEFORE markAsRead:',
      unreadBefore.map(m => m.id),
    );
    console.log('🔥 DEBUG:', {
      conversationId,
      userId,
    });
    console.log('🔥 RUNNING UPDATE MANY');
    const updated = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {not: userId},
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    const unreadAfter = await prisma.message.findMany({
      where: {conversationId, senderId: {not: userId}, read: false},
      select: {id: true, text: true},
    });
    console.log(
      '✅ Unread messages AFTER markAsRead:',
      unreadAfter.map(m => m.id),
    );

    if (global.io) {
      const conversation = await prisma.conversation.findUnique({
        where: {id: conversationId},
      });

      const otherUserId =
        conversation.user1Id === userId
          ? conversation.user2Id
          : conversation.user1Id;

      global.io.to('user_' + otherUserId).emit('messagesRead', {
        conversationId,
      });
    }

    res.json({updatedCount: updated.count});
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({error: 'Server error'});
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

    res.json({success: true});
  } catch (err) {
    console.error('Delete conversation failed:', err);
    res.status(500).json({error: 'Failed to delete conversation'});
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
      },
    });

    if (!conversation) {
      return res.status(404).json({error: 'Conversation not found'});
    }

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({error: 'Server error'});
  }
};
