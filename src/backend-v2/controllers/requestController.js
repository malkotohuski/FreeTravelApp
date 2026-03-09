const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

// Създаване на нова заявка
exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      routeId,
      seekerRequestId,
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

    if (!routeId && !seekerRequestId)
      return res
        .status(400)
        .json({error: 'Route ID or SeekerRequest ID is required.'});

    // Проверка за вече съществуваща заявка
    const existing = await prisma.request.findFirst({
      where: {
        userID: userId,
        status: {not: 'rejected'},
        OR: [
          {routeId: routeId || undefined},
          {seekerRequestId: seekerRequestId || undefined},
        ],
      },
    });

    if (existing)
      return res
        .status(400)
        .json({error: 'You already submitted a request for this route.'});

    // Проверка на дата
    const parsedDate = new Date(dataTime);
    if (isNaN(parsedDate.getTime()))
      return res.status(400).json({error: 'Invalid date format'});

    // Намираме маршрута или SeekerRequest
    let route = null;
    let seeker = null;
    let ownerId = null;

    if (routeId) {
      route = await prisma.route.findUnique({
        where: {id: routeId},
        include: {owner: true},
      });
      if (!route) return res.status(404).json({error: 'Route not found'});
      ownerId = route.owner.id;
    }

    if (seekerRequestId) {
      seeker = await prisma.seekerRequest.findUnique({
        where: {id: seekerRequestId},
        include: {user: true},
      });
      if (!seeker)
        return res.status(404).json({error: 'Seeker request not found'});
      ownerId = seeker.user.id;
    }

    // Създаваме заявката
    const newRequest = await prisma.request.create({
      data: {
        routeId: route ? route.id : null,
        seekerRequestId: seeker ? seeker.id : null,
        userID: userId,
        toUserId: ownerId,
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

    // Upsert notification
    const notificationRouteId = route ? route.id : 0; // <- винаги валидно число
    await prisma.notification.upsert({
      where: {
        recipientId_routeId_message_status: {
          recipientId: ownerId,
          routeId: notificationRouteId,
          message: `${username} is a new candidate for your route`,
          status: 'active',
        },
      },
      update: {},
      create: {
        recipientId: ownerId,
        senderId: userId,
        routeId: notificationRouteId,
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
        seekerRequest: {include: {user: true}},
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

    const approver = request.route?.owner || request.seekerRequest?.user;

    if (!existingDecisionNotification) {
      await prisma.notification.create({
        data: {
          recipientId: request.userID, // ← кандидатът
          routeId: request.routeId,
          message,
          senderId: request.toUserId, // owner-а
          requester: {username: request.username},
          approver: {
            username: approver.username,
            fname: approver.fName,
            lname: approver.lName,
            email: approver.email,
          },
          personalMessage: personalMessage || null,
          read: false,
          status: 'active',
        },
      });
    }

    // Ако е одобрено, създаваме/надграждаме разговор
    if (decision === 'approved') {
      const departureCity =
        request.departureCity ||
        request.seekerRequest?.departureCity ||
        'Unknown';
      const arrivalCity =
        request.arrivalCity || request.seekerRequest?.arrivalCity || 'Unknown';

      if (request.routeId) {
        // Upsert за реален route
        await prisma.conversation.upsert({
          where: {
            routeId_user1Id_user2Id: {
              routeId: request.routeId,
              user1Id: request.toUserId,
              user2Id: request.userID,
            },
          },
          update: {},
          create: {
            routeId: request.routeId,
            user1Id: request.toUserId,
            user2Id: request.userID,
            departureCity,
            arrivalCity,
          },
        });
      } else {
        // Просто findFirst + create за seekerRequest
        const existingConv = await prisma.conversation.findFirst({
          where: {
            routeId: null,
            user1Id: request.toUserId,
            user2Id: request.userID,
          },
        });

        if (!existingConv) {
          await prisma.conversation.create({
            data: {
              routeId: null,
              user1Id: request.toUserId,
              user2Id: request.userID,
              departureCity,
              arrivalCity,
            },
          });
        }
      }
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
