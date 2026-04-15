const {PrismaClient} = require('@prisma/client');
const {t} = require('i18next');
const prisma = new PrismaClient();

// CREATE Seeker Request
// CREATE Seeker Request с лимит 3 на ден
exports.createSeekerRequest = async (req, res) => {
  try {
    const {
      departureCityId,
      departureCity,
      arrivalCityId,
      arrivalCity,
      selectedDateTime,
      routeTitle,
    } = req.body;

    if (
      !departureCityId ||
      !arrivalCityId ||
      !selectedDateTime ||
      !routeTitle
    ) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const userId = req.user.id;

    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) return res.status(404).json({error: 'User not found'});

    const [departureCityRecord, arrivalCityRecord] = await Promise.all([
      prisma.city.findUnique({where: {id: Number(departureCityId)}}),
      prisma.city.findUnique({where: {id: Number(arrivalCityId)}}),
    ]);

    if (!departureCityRecord || !arrivalCityRecord) {
      return res.status(404).json({error: 'Selected city was not found'});
    }

    // 🔹 Ограничение: максимум 3 заявки на ден
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaySeekerCount = await prisma.seekerRequest.count({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (todaySeekerCount >= 3) {
      return res.status(429).json({
        error: t('youHaveReachedMaximum'),
      });
    }

    const newRoute = await prisma.route.create({
      data: {
        ownerId: userId,
        selectedVehicle: 'seeking-driver',
        departureCityId: departureCityRecord.id,
        departureCity: departureCityRecord.name,
        arrivalCityId: arrivalCityRecord.id,
        arrivalCity: arrivalCityRecord.name,
        selectedDateTime: new Date(selectedDateTime),
        routeTitle,
      },
      include: {
        departureCityRef: true,
        arrivalCityRef: true,
      },
    });

    const seeker = await prisma.seekerRequest.create({
      data: {
        routeId: newRoute.id,
        departureCityId: departureCityRecord.id,
        departureCity: departureCityRecord.name,
        arrivalCityId: arrivalCityRecord.id,
        arrivalCity: arrivalCityRecord.name,
        selectedDateTime: new Date(selectedDateTime),
        routeTitle,

        userId: user.id,
        username: user.username,
        userFname: user.fName || '',
        userLname: user.lName || '',
        userEmail: user.email,
        userImage: user.userImage || null,
      },
      include: {
        departureCityRef: true,
        arrivalCityRef: true,
        route: {
          include: {
            departureCityRef: true,
            arrivalCityRef: true,
          },
        },
      },
    });

    return res.status(201).json({
      ...seeker,
      departureCityId: seeker.route?.departureCityId || seeker.departureCityId,
      departureCity:
        seeker.route?.departureCityRef?.name ||
        seeker.departureCityRef?.name ||
        seeker.departureCity,
      arrivalCityId: seeker.route?.arrivalCityId || seeker.arrivalCityId,
      arrivalCity:
        seeker.route?.arrivalCityRef?.name ||
        seeker.arrivalCityRef?.name ||
        seeker.arrivalCity,
    });
  } catch (error) {
    console.error('Create seeker error:', error);
    return res.status(500).json({error: 'Server error'});
  }
};
// GET ALL Seekers
exports.getAllSeekers = async (req, res) => {
  try {
    const seekers = await prisma.seekerRequest.findMany({
      include: {
        route: {
          include: {
            departureCityRef: true,
            arrivalCityRef: true,
          },
        },
        departureCityRef: true,
        arrivalCityRef: true,
        user: {
          select: {
            id: true,
            username: true,
            fName: true,
            lName: true,
            userImage: true,
          },
        },
      },
      orderBy: {createdAt: 'desc'},
    });

    return res.json({
      seekers: seekers.map(seeker => ({
        ...seeker,
        departureCityId:
          seeker.route?.departureCityId || seeker.departureCityId || null,
        departureCity:
          seeker.route?.departureCityRef?.name ||
          seeker.departureCityRef?.name ||
          seeker.route?.departureCity ||
          seeker.departureCity,
        arrivalCityId:
          seeker.route?.arrivalCityId || seeker.arrivalCityId || null,
        arrivalCity:
          seeker.route?.arrivalCityRef?.name ||
          seeker.arrivalCityRef?.name ||
          seeker.route?.arrivalCity ||
          seeker.arrivalCity,
      })),
    });
  } catch (error) {
    console.error('Get seekers error:', error);
    return res.status(500).json({error: 'Server error'});
  }
};

exports.deleteSeeker = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const seeker = await prisma.seekerRequest.findUnique({
      where: {id},
      select: {id: true, userId: true, routeId: true},
    });

    if (!seeker) {
      return res.status(404).json({error: 'Seeker route not found'});
    }

    if (seeker.userId !== req.user.id) {
      return res.status(403).json({error: 'Unauthorized'});
    }

    await prisma.seekerRequest.delete({
      where: {id},
    });

    if (seeker.routeId) {
      await prisma.route.updateMany({
        where: {id: seeker.routeId, ownerId: req.user.id},
        data: {status: 'deleted'},
      });
    }

    return res.json({message: 'Seeker route deleted'});
  } catch (err) {
    console.error('Delete seeker error:', err);
    return res.status(500).json({error: 'Server error'});
  }
};
