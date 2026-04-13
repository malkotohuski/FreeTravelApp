const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {sendNotification} = require('./notificationController');

const getRequestCityName = (entity, relationKey, fallbackKey) =>
  entity?.[relationKey]?.name || entity?.[fallbackKey] || '';

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
      departureCityId,
      departureCity,
      arrivalCityId,
      arrivalCity,
      dataTime,
      requestComment,
    } = req.body;

    if (!routeId && !seekerRequestId)
      return res
        .status(400)
        .json({error: 'Route ID or SeekerRequest ID is required.'});

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

    const parsedDate = new Date(dataTime);
    if (isNaN(parsedDate.getTime()))
      return res.status(400).json({error: 'Invalid date format'});

    let route = null;
    let seeker = null;
    let ownerId = null;

    if (routeId) {
      route = await prisma.route.findUnique({
        where: {id: routeId},
        include: {owner: true, departureCityRef: true, arrivalCityRef: true},
      });
      if (!route) return res.status(404).json({error: 'Route not found'});
      ownerId = route.owner.id;
    }

    if (seekerRequestId) {
      seeker = await prisma.seekerRequest.findUnique({
        where: {id: seekerRequestId},
        include: {
          user: true,
          departureCityRef: true,
          arrivalCityRef: true,
        },
      });
      if (!seeker)
        return res.status(404).json({error: 'Seeker request not found'});
      ownerId = seeker.user.id;
    }

    const resolvedDepartureCityId =
      route?.departureCityId || seeker?.departureCityId || departureCityId || null;
    const resolvedArrivalCityId =
      route?.arrivalCityId || seeker?.arrivalCityId || arrivalCityId || null;

    let resolvedDepartureCityName =
      getRequestCityName(route, 'departureCityRef', 'departureCity') ||
      getRequestCityName(seeker, 'departureCityRef', 'departureCity') ||
      departureCity ||
      '';
    let resolvedArrivalCityName =
      getRequestCityName(route, 'arrivalCityRef', 'arrivalCity') ||
      getRequestCityName(seeker, 'arrivalCityRef', 'arrivalCity') ||
      arrivalCity ||
      '';

    if (!resolvedDepartureCityName && resolvedDepartureCityId) {
      const departureCityRecord = await prisma.city.findUnique({
        where: {id: Number(resolvedDepartureCityId)},
      });
      resolvedDepartureCityName = departureCityRecord?.name || '';
    }

    if (!resolvedArrivalCityName && resolvedArrivalCityId) {
      const arrivalCityRecord = await prisma.city.findUnique({
        where: {id: Number(resolvedArrivalCityId)},
      });
      resolvedArrivalCityName = arrivalCityRecord?.name || '';
    }

    // Създаваме заявката
    const newRequest = await prisma.request.create({
      data: {
        routeId: route ? route.id : null, // Int или null
        seekerRequestId: seeker ? seeker.id : null, // Int или null
        userID: userId,
        username: username || '',
        userFname: userFname || '',
        userLname: userLname || '',
        userEmail: userEmail || '',
        userRouteId: userRouteId || 0,
        departureCityId: resolvedDepartureCityId
          ? Number(resolvedDepartureCityId)
          : null,
        departureCity: resolvedDepartureCityName,
        arrivalCityId: resolvedArrivalCityId ? Number(resolvedArrivalCityId) : null,
        arrivalCity: resolvedArrivalCityName,
        dataTime: parsedDate,
        requestComment: requestComment || '',
        status: 'pending',
        toUserId: ownerId,
      },
    });

    // 🔔 Push нотификация
    await sendNotification({
      recipientId: ownerId,
      senderId: userId,
      message: `${username || 'Someone'} is interested in your route`,
      routeId: route?.id || null, // <--- тук е промяната
      type: 'request',
      data: {
        screen: 'request',
        type: 'request',
        routeId: route?.id || null, // <--- също така
        requesterId: userId, // Number вече, не String
        username: username || '',
        fName: userFname || '',
        lName: userLname || '',
        email: userEmail || '',
        comment: requestComment || '',
      },
      skipPushIfOnline: true,
    });

    res
      .status(201)
      .json({message: 'Request created successfully', request: newRequest});
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({error: 'Failed to create request.'});
  }
};

// Взимане на всички заявки
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await prisma.request.findMany();
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to fetch requests.'});
  }
};

// Одобряване/отхвърляне на заявка
exports.makeDecision = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const {decision, personalMessage} = req.body;

    if (!['approved', 'rejected'].includes(decision))
      return res.status(400).json({error: 'Invalid decision value.'});

    const request = await prisma.request.findUnique({
      where: {id: requestId},
      include: {
        departureCityRef: true,
        arrivalCityRef: true,
        route: {
          include: {
            owner: true,
            departureCityRef: true,
            arrivalCityRef: true,
          },
        },
        seekerRequest: {
          include: {
            user: true,
            departureCityRef: true,
            arrivalCityRef: true,
          },
        },
      },
    });

    if (!request) return res.status(404).json({error: 'Request not found.'});
    if (request.status !== 'pending')
      return res
        .status(400)
        .json({error: 'Request has already been processed.'});

    // 1️⃣ Update на статус на заявката
    const updatedRequest = await prisma.request.update({
      where: {id: requestId},
      data: {status: decision, decidedAt: new Date()},
    });

    // 2️⃣ Изпращане на нотификация към кандидата
    await sendNotification({
      recipientId: request.userID,
      senderId: request.toUserId,
      message:
        decision === 'approved'
          ? 'You are approved for the trip ✅'
          : 'Your request for the trip was not approved ❌',
      routeId: request.routeId,
      type: 'approval',
      data: {routeId: request.routeId, status: decision},
      skipPushIfOnline: true,
    });

    // 3️⃣ Създаване / upsert на conversation, ако е одобрено
    if (decision === 'approved') {
      const departureCity =
        request.departureCityRef?.name ||
        request.route?.departureCityRef?.name ||
        request.seekerRequest?.departureCityRef?.name ||
        request.departureCity ||
        request.seekerRequest?.departureCity ||
        'Unknown';
      const arrivalCity =
        request.arrivalCityRef?.name ||
        request.route?.arrivalCityRef?.name ||
        request.seekerRequest?.arrivalCityRef?.name ||
        request.arrivalCity ||
        request.seekerRequest?.arrivalCity ||
        'Unknown';

      if (request.routeId) {
        // Upsert за реален route
        const conversation = await prisma.conversation.upsert({
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

        if (global.io) {
          global.io
            .to('user_' + request.toUserId)
            .emit('newConversation', conversation);
          global.io
            .to('user_' + request.userID)
            .emit('newConversation', conversation);
        }
      } else {
        // findFirst + create за seekerRequest
        const existingConv = await prisma.conversation.findFirst({
          where: {
            routeId: null,
            user1Id: request.toUserId,
            user2Id: request.userID,
          },
        });

        if (!existingConv) {
          const conversation = await prisma.conversation.create({
            data: {
              routeId: null,
              user1Id: request.toUserId,
              user2Id: request.userID,
              departureCity,
              arrivalCity,
            },
          });

          if (global.io) {
            global.io
              .to('user_' + request.toUserId)
              .emit('newConversation', conversation);
            global.io
              .to('user_' + request.userID)
              .emit('newConversation', conversation);
          }
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

// Маркиране на заявка като прочетена
exports.markAsRead = async (req, res) => {
  const requestId = parseInt(req.params.id);
  if (isNaN(requestId))
    return res.status(400).json({message: 'Invalid request ID'});

  try {
    const updated = await prisma.request.update({
      where: {id: requestId},
      data: {read: true},
    });
    res.json(updated);
  } catch (err) {
    console.error('Mark as read failed:', err);
    res.status(500).json({message: 'Failed to mark as read'});
  }
};
