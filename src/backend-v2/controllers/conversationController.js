const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

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
      conversation = await prisma.conversation.create({
        data: {
          routeId,
          user1Id,
          user2Id,
          departureCity: route.departureCity,
          arrivalCity: route.arrivalCity,
        },
        include: {
          messages: {orderBy: {createdAt: 'asc'}},
          user1: {select: {id: true, username: true}},
          user2: {select: {id: true, username: true}},
        },
      });
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

    const message = await prisma.message.create({
      data: {conversationId, senderId, text},
    });

    res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({error: 'Server error'});
  }
};

// Вземане на разговори за потребител
exports.getUserConversations = async (req, res) => {
  const userId = Number(req.params.userId);

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{user1Id: userId}, {user2Id: userId}],
      },
      include: {
        messages: {
          orderBy: {createdAt: 'asc'},
        },
      },
    });

    const conversationsWithExtras = await Promise.all(
      conversations.map(async conv => {
        const otherUserId =
          conv.user1Id === userId ? conv.user2Id : conv.user1Id;

        const otherUser = await prisma.user.findUnique({
          where: {id: otherUserId},
          select: {
            id: true,
            username: true,
          },
        });

        // 🔥 ТУК изчисляваме unreadCount
        const unreadCount = conv.messages.filter(
          msg => msg.senderId !== userId && msg.read === false,
        ).length;

        return {
          ...conv,
          otherUser,
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
exports.markAsRead = async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = Number(req.body.userId);

  try {
    if (!conversationId || !userId) {
      return res.status(400).json({error: 'Invalid data'});
    }

    const updated = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {not: userId},
        read: false,
      },
      data: {
        read: true,
      },
    });

    res.json({updatedCount: updated.count});
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({error: 'Server error'});
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
