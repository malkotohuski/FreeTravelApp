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
