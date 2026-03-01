const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

exports.createRoute = async (req, res) => {
  try {
    const userId = req.user.userId; // идва от JWT
    const route = req.body;

    if (!route) {
      return res.status(400).json({error: 'Missing route data'});
    }

    // 🔒 Rate limit – 3 маршрута за 1 час
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const routesLastHour = await prisma.route.count({
      where: {
        ownerId: userId,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (routesLastHour >= 3) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Max 3 routes per hour.',
      });
    }

    // 🔒 Duplicate guard
    const duplicate = await prisma.route.findFirst({
      where: {
        ownerId: userId,
        departureCity: route.departureCity,
        arrivalCity: route.arrivalCity,
        selectedDateTime: new Date(route.selectedDateTime),
      },
    });

    if (duplicate) {
      return res.status(409).json({
        error: 'Route already exists.',
      });
    }

    const newRoute = await prisma.route.create({
      data: {
        ownerId: userId,
        selectedVehicle: route.selectedVehicle,
        registrationNumber: route.registrationNumber,
        departureCity: route.departureCity,
        departureStreet: route.departureStreet,
        departureNumber: route.departureNumber,
        arrivalCity: route.arrivalCity,
        arrivalStreet: route.arrivalStreet,
        arrivalNumber: route.arrivalNumber,
        selectedDateTime: new Date(route.selectedDateTime),
        routeTitle: route.routeTitle,
      },
    });

    return res.status(201).json({
      message: 'Route created successfully',
      route: newRoute,
    });
  } catch (error) {
    console.error('Create route error:', error);
    return res.status(500).json({error: 'Internal server error'});
  }
};

exports.getActiveRoutes = async (req, res) => {
  try {
    const now = new Date();

    const routes = await prisma.route.findMany({
      where: {
        selectedDateTime: {
          gte: now,
        },
        status: 'active',
      },
      orderBy: {
        selectedDateTime: 'asc',
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fName: true,
            lName: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json(routes);
  } catch (error) {
    console.error('Get routes error:', error);
    return res.status(500).json({error: 'Internal server error'});
  }
};

exports.completeRoute = async (req, res) => {
  try {
    const routeId = Number(req.params.id);
    const userId = req.user.userId;

    // 1️⃣ Проверка дали маршрутът съществува
    const route = await prisma.route.findUnique({
      where: {id: routeId},
    });

    if (!route) {
      return res.status(404).json({error: 'Route not found'});
    }

    // 2️⃣ Проверка дали принадлежи на user-а
    if (route.ownerId !== userId) {
      return res.status(403).json({error: 'Unauthorized'});
    }

    // 3️⃣ Проверка дали вече е completed
    if (route.status === 'completed') {
      return res.status(400).json({error: 'Route already completed'});
    }

    await prisma.$transaction(async tx => {
      // ✅ Update route
      await tx.route.update({
        where: {id: routeId},
        data: {status: 'completed'},
      });

      // ✅ Взимаме всички approved заявки
      const approvedRequests = await tx.request.findMany({
        where: {
          routeId: routeId,
          status: 'approved',
        },
      });

      // ✅ Ако няма пътници — спираме тук
      if (approvedRequests.length === 0) {
        return;
      }

      // ✅ Създаваме нотификации
      for (const req of approvedRequests) {
        // Към пътника
        await tx.notification.create({
          data: {
            recipientId: req.userID,
            routeId: routeId,
            message: `Please rate the trip`,
            senderId: userId,
            read: false,
            status: 'active',
          },
        });

        // Към шофьора
        await tx.notification.create({
          data: {
            recipientId: route.ownerId,
            routeId: routeId,
            message: `Please rate your passenger`,
            senderId: req.userID,
            read: false,
            status: 'active',
          },
        });
      }
    });

    return res.status(200).json({message: 'Route marked as completed'});
  } catch (error) {
    console.error('Complete route error:', error);
    return res.status(500).json({error: 'Internal server error'});
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const routeId = Number(req.params.id);
    const userId = req.user.userId;

    const route = await prisma.route.findUnique({
      where: {id: routeId},
    });

    if (!route) {
      return res.status(404).json({error: 'Route not found'});
    }

    if (route.ownerId !== userId) {
      return res.status(403).json({error: 'Unauthorized'});
    }

    if (route.status === 'deleted') {
      return res.status(400).json({error: 'Route already deleted'});
    }

    await prisma.route.update({
      where: {id: routeId},
      data: {status: 'deleted'},
    });

    return res.status(200).json({message: 'Route deleted successfully'});
  } catch (error) {
    console.error('Delete route error:', error);
    return res.status(500).json({error: 'Internal server error'});
  }
};

exports.getMyRoutes = async (req, res) => {
  try {
    const userId = req.user.userId;

    const routes = await prisma.route.findMany({
      where: {
        ownerId: userId,
        status: 'active',
      },
      orderBy: {
        selectedDateTime: 'desc',
      },
    });

    return res.status(200).json(routes);
  } catch (error) {
    console.error('Get my routes error:', error);
    return res.status(500).json({error: 'Internal server error'});
  }
};
