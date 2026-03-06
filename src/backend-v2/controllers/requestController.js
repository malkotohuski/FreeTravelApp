const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

// Създаване на нова заявка
exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      routeId,
      username,
      userFname,
      userLname,
      userEmail,
      userRouteId,
      departureCity,
      arrivalCity,
      dataTime,
      requestComment,
    } = req.body;

    if (!routeId) return res.status(400).json({error: 'Route ID is required.'});

    // Проверка за вече съществуваща заявка
    const existing = await prisma.request.findFirst({
      where: {
        routeId,
        userID: userId,
        status: {not: 'rejected'},
      },
    });

    if (existing)
      return res.status(400).json({
        error: 'You already submitted a request for this route.',
      });

    // Проверка на дата
    const parsedDate = new Date(dataTime);
    if (isNaN(parsedDate.getTime()))
      return res.status(400).json({error: 'Invalid date format'});

    // Намираме маршрута
    const route = await prisma.route.findUnique({
      where: {id: routeId},
      include: {owner: true},
    });

    if (!route) return res.status(404).json({error: 'Route not found'});

    // Създаваме заявката
    const newRequest = await prisma.request.create({
      data: {
        routeId: route.id,
        userID: userId,
        toUserId: route.owner.id,
        username,
        userFname,
        userLname,
        userEmail,
        userRouteId: userRouteId || 0,
        departureCity,
        arrivalCity,
        dataTime: parsedDate,
        requestComment,
        status: 'pending',
      },
    });

    await prisma.notification.upsert({
      where: {
        recipientId_routeId_message_status: {
          recipientId: route.owner.id,
          routeId: route.id,
          message: `${username} is a new candidate for your route`,
          status: 'active',
        },
      },
      update: {},
      create: {
        recipientId: route.owner.id,
        senderId: userId,
        routeId: route.id,
        message: `${username} is a new candidate for your route`,
        requester: {
          username,
          fName: userFname,
          lName: userLname,
          email: userEmail,
          comment: requestComment,
        },
        read: false,
        status: 'active',
      },
    });

    // Уведомление към owner-а

    res
      .status(201)
      .json({message: 'Request created successfully', request: newRequest});
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({error: 'Failed to create request.'});
  }
};

// Взимане на всички заявки (за админ или за текущия user)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await prisma.request.findMany();
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to fetch requests.'});
  }
};

exports.makeDecision = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const {decision, personalMessage} = req.body;

    if (!['approved', 'rejected'].includes(decision))
      return res.status(400).json({error: 'Invalid decision value.'});

    // Взимаме заявката
    const request = await prisma.request.findUnique({
      where: {id: requestId},
      include: {
        route: {include: {owner: true}},
      },
    });

    if (!request) return res.status(404).json({error: 'Request not found.'});

    if (request.status !== 'pending')
      return res
        .status(400)
        .json({error: 'Request has already been processed.'});

    // Update status на заявката
    const updatedRequest = await prisma.request.update({
      where: {id: requestId},
      data: {status: decision, decidedAt: new Date()},
    });

    // Уведомление към кандидата
    const message =
      decision === 'approved'
        ? `Your request for ${request.departureCity}-${request.arrivalCity} was approved.`
        : `Your request for ${request.departureCity}-${request.arrivalCity} was rejected.`;

    const existingDecisionNotification = await prisma.notification.findFirst({
      where: {
        recipientId: request.userID,
        routeId: request.routeId,
        message: {contains: decision === 'approved' ? 'approved' : 'rejected'},
        status: 'active',
      },
    });

    if (!existingDecisionNotification) {
      await prisma.notification.create({
        data: {
          recipientId: request.userID, // ← кандидатът
          routeId: request.routeId,
          message,
          senderId: request.toUserId, // owner-а
          requester: {username: request.username},
          approver: {
            username: request.route.owner.username,
            fname: request.route.owner.fName,
            lname: request.route.owner.lName,
            email: request.route.owner.email,
          },
          personalMessage: personalMessage || null,
          read: false,
          status: 'active',
        },
      });
    }

    // Ако е одобрено, създаваме/надграждаме разговор
    if (decision === 'approved') {
      await prisma.conversation.upsert({
        where: {
          routeId_user1Id_user2Id: {
            routeId: request.routeId,
            user1Id: request.toUserId, // owner
            user2Id: request.userID, // кандидат
          },
        },
        update: {},
        create: {
          routeId: request.routeId,
          user1Id: request.toUserId,
          user2Id: request.userID,
          departureCity: request.departureCity,
          arrivalCity: request.arrivalCity,
        },
      });
    }

    res.status(200).json({
      message: `Request ${decision} successfully`,
      request: updatedRequest,
    });
  } catch (err) {
    console.error('Decision error:', err);
    res.status(500).json({error: 'Internal server error.'});
  }
};

exports.markAsRead = async (req, res) => {
  const requestId = parseInt(req.params.id);

  if (isNaN(requestId)) {
    return res.status(400).json({message: 'Invalid request ID'});
  }

  try {
    const request = await prisma.request.findUnique({
      where: {id: requestId},
    });

    if (!request) {
      return res.status(404).json({message: 'Request not found'});
    }

    const updated = await prisma.request.update({
      where: {id: requestId},
      data: {read: true},
    });

    res.json(updated);
  } catch (error) {
    console.error('Mark as read failed:', error);
    res.status(500).json({message: 'Failed to mark as read'});
  }
};
