const {PrismaClient} = require('@prisma/client');
const {t} = require('i18next');
const prisma = new PrismaClient();

// CREATE Seeker Request
// CREATE Seeker Request с лимит 3 на ден
exports.createSeekerRequest = async (req, res) => {
  try {
    const {departureCity, arrivalCity, selectedDateTime, routeTitle} = req.body;

    if (!departureCity || !arrivalCity || !selectedDateTime || !routeTitle) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const userId = req.user.id;

    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) return res.status(404).json({error: 'User not found'});

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

    const seeker = await prisma.seekerRequest.create({
      data: {
        departureCity,
        arrivalCity,
        selectedDateTime: new Date(selectedDateTime),
        routeTitle,
        userId: user.id,
        username: user.username,
        userFname: user.fName || '',
        userLname: user.lName || '',
        userEmail: user.email,
        userImage: user.userImage || null,
      },
    });

    res.status(201).json(seeker);
  } catch (error) {
    console.error('Create seeker error:', error);
    res.status(500).json({error: 'Server error'});
  }
};
// GET ALL Seekers
exports.getAllSeekers = async (req, res) => {
  try {
    const seekers = await prisma.seekerRequest.findMany({
      include: {
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

    res.json({seekers});
  } catch (error) {
    console.error('Get seekers error:', error);
    res.status(500).json({error: 'Server error'});
  }
};

exports.deleteSeeker = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.seekerRequest.delete({
      where: {id},
    });

    res.json({message: 'Seeker route deleted'});
  } catch (err) {
    console.error('Delete seeker error:', err);
    res.status(500).json({error: 'Server error'});
  }
};
