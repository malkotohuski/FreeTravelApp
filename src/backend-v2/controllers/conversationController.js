const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {sendNotification} = require('./notificationController');

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

// Ð¡Ñ‚Ð°Ñ€Ñ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ñ€Ð°Ð·Ð³Ð¾Ð²Ð¾Ñ€
exports.startConversation = async (req, res) => {
  const {routeId, user2Id} = req.body;
  const user1Id = req.user.id;

  try {
    if (!user2Id) {
      return res
        .status(400)
        .json({error: 'Cannot start chat: senderId missing'});
    }

    // ÐŸÑ€Ð¾Ð²ÐµÑ€ÐºÐ° Ð·Ð° ÑÑŠÑ‰ÐµÑÑ‚Ð²ÑƒÐ²Ð°Ñ‰ Ñ€Ð°Ð·Ð³Ð¾Ð²Ð¾Ñ€
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

    // ÐÐºÐ¾ Ð½ÑÐ¼Ð° - ÑÑŠÐ·Ð´Ð°Ð²Ð°Ð¼Ðµ
    if (!conversation) {
      // 1ï¸âƒ£ ÑÑŠÐ·Ð´Ð°Ð²Ð°Ð¼Ðµ conversation
      const newConversation = await prisma.conversation.create({
        data: {
          routeId,
          user1Id,
          user2Id,
          departureCity: departureCityName,
          arrivalCity: arrivalCityName,
        },
      });

      // 2ï¸âƒ£ ÑÑŠÐ·Ð´Ð°Ð²Ð°Ð¼Ðµ Ð¿ÑŠÑ€Ð²Ð¾ ÑÑŠÐ¾Ð±Ñ‰ÐµÐ½Ð¸Ðµ (Ð’ÐÐ–ÐÐž ðŸ”¥)
      await prisma.message.create({
        data: {
          conversationId: newConversation.id,
          senderId: user1Id, // Ð¼Ð¾Ð¶Ðµ Ð¸ req.user.id Ð°ÐºÐ¾ Ð¸Ð¼Ð°Ñˆ auth
          text: `${departureCityName} - ${arrivalCityName}`,
        },
      });
      // 3ï¸âƒ£ Ð²Ð·Ð¸Ð¼Ð°Ð¼Ðµ conversation Ñ messages + image
      const fullConversation = await prisma.conversation.findUnique({
        where: {id: newConversation.id},
        include: {
          messages: {orderBy: {createdAt: 'asc'}},
          user1: {select: {id: true, username: true, userImage: true}},
          user2: {select: {id: true, username: true, userImage: true}},
        },
      });

      // 4ï¸âƒ£ Ð¿Ñ€Ð°Ð²Ð¸Ð¼ Ñ€Ð°Ð·Ð»Ð¸Ñ‡ÐµÐ½ Ð¾Ð±ÐµÐºÑ‚ Ð·Ð° Ð²ÑÐµÐºÐ¸ user
      const {convForUser1, convForUser2} =
        buildConversationPayloads(fullConversation);

      // 5ï¸âƒ£ socket emit
      if (global.io) {
        global.io.to('user_' + user1Id).emit('newConversation', convForUser1);
        global.io.to('user_' + user2Id).emit('newConversation', convForUser2);
      }

      // Ð²Ð°Ð¶Ð½Ð¾
      conversation = fullConversation;
    }

    res.json(conversation);
  } catch (error) {
    console.error('Conversation start error:', error);
    res.status(500).json({error: 'Server error'});
  }
};

// Ð’Ð·ÐµÐ¼Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ¾Ð±Ñ‰ÐµÐ½Ð¸Ñ
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

// Ð˜Ð·Ð¿Ñ€Ð°Ñ‰Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ¾Ð±Ñ‰ÐµÐ½Ð¸Ðµ
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

    // 1ï¸âƒ£ Ð¡ÑŠÐ·Ð´Ð°Ð²Ð°Ð¼Ðµ ÑÑŠÐ¾Ð±Ñ‰ÐµÐ½Ð¸ÐµÑ‚Ð¾
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        text,
        read: false,
      },
    });

    // 2ï¸âƒ£ Emit Ð² Ñ€ÐµÐ°Ð»Ð½Ð¾ Ð²Ñ€ÐµÐ¼Ðµ ÐºÑŠÐ¼ conversation room Ð¸ user rooms
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

    // 3ï¸âƒ£ Auto-restore conversation, Ð°ÐºÐ¾ Ð½ÑÐºÐ¾Ð¹ Ðµ ÑÐºÑ€Ð¸Ð»
    await prisma.conversation.update({
      where: {id: conversationId},
      data: {hiddenByUser1: false, hiddenByUser2: false},
    });

    // ðŸ”¥ 4ï¸âƒ£ ÐÐ• Ð¿Ñ€Ð°Ð²Ð¸Ð¼ Ð½Ð¾Ñ‚Ð¸Ñ„Ð¸ÐºÐ°Ñ†Ð¸Ñ Ð·Ð° Ñ‡Ð°Ñ‚! ÐŸÑ€Ð¾ÑÑ‚Ð¾ skip
    // await sendNotification(...);  <- Ð¿Ñ€ÐµÐ¼Ð°Ñ…Ð½Ð°Ñ‚Ð¾ Ð·Ð° chat messages

    return res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({error: 'Server error'});
  }
};

// Ð’Ð·ÐµÐ¼Ð°Ð½Ðµ Ð½Ð° Ñ€Ð°Ð·Ð³Ð¾Ð²Ð¾Ñ€Ð¸ Ð·Ð° Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»
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
          username: 'ÐŸÐ¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»',
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

// ÐœÐ°Ñ€ÐºÐ¸Ñ€Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ¾Ð±Ñ‰ÐµÐ½Ð¸Ñ ÐºÐ°Ñ‚Ð¾ Ð¿Ñ€Ð¾Ñ‡ÐµÑ‚ÐµÐ½Ð¸
// Ð’ markAsRead
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

exports.deleteConversation = async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = req.user.id; // Ð¸Ð´Ð²Ð° Ð¾Ñ‚ Ñ‚Ð²Ð¾Ñ JWT middleware

  try {
    const conversation = await prisma.conversation.findUnique({
      where: {id: conversationId},
    });

    if (!conversation) {
      return res.status(404).json({error: 'Conversation not found'});
    }

    // ÐŸÑ€Ð¾Ð²ÐµÑ€ÑÐ²Ð°Ð¼Ðµ ÐºÐ¾Ð¹ Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ» Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°
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

    // ÐÐºÑ‚ÑƒÐ°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð¼Ðµ soft delete Ñ„Ð»Ð°Ð³Ð°
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

