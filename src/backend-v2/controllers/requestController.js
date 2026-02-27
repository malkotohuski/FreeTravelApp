const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

// Създаване на нова заявка
exports.createRequest = async (req, res) => {
  try {
    const {requestingUser} = req.body;
    if (!requestingUser) {
      return res.status(400).json({error: 'Requesting user is undefined.'});
    }

    if (!requestingUser.routeId || !requestingUser.userID) {
      return res
        .status(400)
        .json({error: 'Route ID and User ID are required.'});
    }

    // Проверка за съществуваща заявка
    const existing = await prisma.request.findFirst({
      where: {
        routeId: requestingUser.routeId,
        userID: requestingUser.userID,
        status: {not: 'rejected'},
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({error: 'You already submitted a request for this route.'});
    }

    // Проверка и конвертиране на дата
    const parsedDate = new Date(requestingUser.dataTime);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({error: 'Invalid date format'});
    }

    // 1️⃣ намираме маршрута първо
    const route = await prisma.route.findUnique({
      where: {id: requestingUser.routeId},
      include: {owner: true},
    });

    if (!route) {
      return res.status(404).json({error: 'Route not found'});
    }

    // 2️⃣ създаваме заявката
    const newRequest = await prisma.request.create({
      data: {
        routeId: requestingUser.routeId,
        userID: requestingUser.userID,
        toUserId: route.owner.id,
        username: requestingUser.username,
        userFname: requestingUser.userFname,
        userLname: requestingUser.userLname,
        userEmail: requestingUser.userEmail,
        userRouteId: requestingUser.userRouteId || 0,
        departureCity: requestingUser.departureCity,
        arrivalCity: requestingUser.arrivalCity,
        dataTime: new Date(requestingUser.dataTime),
        requestComment: requestingUser.requestComment,
        status: 'pending',
      },
    });

    // 3️⃣ Създаваме notification
    await prisma.notification.create({
      data: {
        recipient: route.owner.username,
        routeId: requestingUser.routeId,
        message: `You have a new candidate for your route: ${requestingUser.departureCity}-${requestingUser.arrivalCity}`,
        senderId: requestingUser.userID,
        requester: {
          username: requestingUser.username,
          userFname: requestingUser.userFname,
          userLname: requestingUser.userLname,
          userEmail: requestingUser.userEmail,
          comment: requestingUser.requestComment,
        },
        personalMessage: null,
        read: false,
        status: 'active',
      },
    });

    res
      .status(201)
      .json({message: 'Request created successfully', request: newRequest});
  } catch (err) {
    console.error(err);
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

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({error: 'Invalid decision value.'});
    }

    const request = await prisma.request.findUnique({
      where: {id: requestId},
      include: {
        route: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!request) return res.status(404).json({error: 'Request not found.'});

    if (request.status !== 'pending')
      return res
        .status(400)
        .json({error: 'Request has already been processed.'});

    // 1️⃣ update request
    const updatedRequest = await prisma.request.update({
      where: {id: requestId},
      data: {status: decision},
    });

    // 2️⃣ създаваме notification към кандидата
    const message =
      decision === 'approved'
        ? `Your request for ${request.departureCity}-${request.arrivalCity} was approved.`
        : `Your request for ${request.departureCity}-${request.arrivalCity} was rejected.`;

    await prisma.notification.create({
      data: {
        recipient: request.username,
        routeId: request.routeId,
        message: message,
        senderId: request.toUserId,

        requester: {
          username: request.username,
        },

        // 👇 НОВО – данни на одобряващия
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

    if (decision === 'approved') {
      await prisma.conversation.upsert({
        where: {
          routeId_user1Id_user2Id: {
            routeId: request.routeId,
            user1Id: request.toUserId, // owner
            user2Id: request.fromUserId, // кандидат
          },
        },
        update: {},
        create: {
          routeId: request.routeId,
          user1Id: request.toUserId,
          user2Id: request.fromUserId,
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
