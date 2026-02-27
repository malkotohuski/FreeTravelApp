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

    // Ако няма → създаваме
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {routeId, user1Id, user2Id},
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
    // Взимаме всички разговори на потребителя
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{user1Id: userId}, {user2Id: userId}],
      },
      include: {
        messages: {
          orderBy: {createdAt: 'asc'}, // последователност на съобщенията
        },
      },
    });

    // Добавяме поле otherUser към всеки разговор
    const conversationsWithOtherUser = await Promise.all(
      conversations.map(async conv => {
        const otherUserId =
          conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const otherUser = await prisma.user.findUnique({
          where: {id: otherUserId},
          select: {
            id: true,
            username: true,
            // добави други полета ако са нужни
          },
        });

        return {
          ...conv,
          otherUser,
        };
      }),
    );

    res.json(conversationsWithOtherUser);
  } catch (error) {
    console.error('Get user conversations error:', error);
    res.status(500).json({error: 'Server error'});
  }
};

// Маркиране на съобщения като прочетени
exports.markAsRead = async (req, res) => {
  const conversationId = Number(req.params.id);
  const {userId} = req.body;

  try {
    const updated = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {not: userId},
        read: false,
      },
      data: {read: true},
    });

    res.json({updatedCount: updated.count});
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({error: 'Server error'});
  }
};
