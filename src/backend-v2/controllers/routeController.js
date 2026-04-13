const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

exports.createRoute = async (req, res) => {
  try {
    const userId = req.user.id;
    const route = req.body;

    if (!route) {
      return res.status(400).json({error: 'Missing route data'});
    }

    if (!route.departureCityId || !route.arrivalCityId) {
      return res.status(400).json({error: 'Departure and arrival city IDs are required'});
    }

    const [departureCityRecord, arrivalCityRecord] = await Promise.all([
      prisma.city.findUnique({where: {id: Number(route.departureCityId)}}),
      prisma.city.findUnique({where: {id: Number(route.arrivalCityId)}}),
    ]);

    if (!departureCityRecord || !arrivalCityRecord) {
      return res.status(404).json({error: 'Selected city was not found'});
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
        departureCity: departureCityRecord.name,
        arrivalCity: arrivalCityRecord.name,
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
        departureCityId: departureCityRecord.id,
        departureCity: departureCityRecord.name,
        departureStreet: route.departureStreet,
        departureNumber: route.departureNumber,
        arrivalCityId: arrivalCityRecord.id,
        arrivalCity: arrivalCityRecord.name,
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
            userImage: true,
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
    const userId = req.user.id;

    const route = await prisma.route.findUnique({
      where: {id: routeId},
    });

    if (!route) {
      return res.status(404).json({error: 'Route not found'});
    }

    if (route.ownerId !== userId) {
      return res.status(403).json({error: 'Unauthorized'});
    }

    if (route.status === 'completed') {
      return res.status(400).json({error: 'Route already completed'});
    }

    await prisma.$transaction(async tx => {
      await tx.route.update({
        where: {id: routeId},
        data: {status: 'completed'},
      });

      const approvedRequests = await tx.request.findMany({
        where: {
          routeId: routeId,
          status: 'approved',
        },
      });

      if (approvedRequests.length === 0) {
        return;
      }

      for (const req of approvedRequests) {
        // 1️⃣ notification към пътника
        const passengerNotification = await tx.notification.create({
          data: {
            recipientId: req.userID,
            routeId: routeId,
            message: `Rate the trip from ${route.departureCity} to ${route.arrivalCity}`,
            senderId: userId,
            read: false,
            status: 'active',
          },
        });

        // 🔴 SOCKET
        global.io
          .to('user_' + req.userID)
          .emit('newNotification', passengerNotification);

        // 2️⃣ notification към шофьора
        const driverNotification = await tx.notification.create({
          data: {
            recipientId: route.ownerId,
            routeId: routeId,
            message: `Rate your passenger for the trip from ${route.departureCity} to ${route.arrivalCity}`,
            senderId: req.userID,
            read: false,
            status: 'active',
          },
        });

        // 🔴 SOCKET
        global.io
          .to('user_' + route.ownerId)
          .emit('newNotification', driverNotification);
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
    const userId = req.user.id;

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
    const userId = req.user.id;

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
