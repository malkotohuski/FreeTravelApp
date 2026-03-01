const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

exports.createRating = async (req, res) => {
  try {
    const {routeId, ratedId, score, comment} = req.body;
    const raterId = req.user.userId;

    // 1️⃣ Basic validation
    if (!routeId || !ratedId || !score) {
      return res.status(400).json({message: 'Missing required fields.'});
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({message: 'Score must be between 1 and 5.'});
    }

    if (raterId === ratedId) {
      return res.status(400).json({message: 'You cannot rate yourself.'});
    }

    // 2️⃣ Проверяваме дали route съществува
    const route = await prisma.route.findUnique({
      where: {id: routeId},
      select: {id: true, userId: true},
    });

    if (!route) {
      return res.status(404).json({message: 'Route not found.'});
    }

    // 3️⃣ Проверка за approved request между тези users (по-ясна логика)
    const approvedRequest = await prisma.request.findFirst({
      where: {
        routeId: routeId,
        status: 'approved',
        OR: [
          {
            userID: ratedId,
            route: {userId: raterId},
          },
          {
            userID: raterId,
            route: {userId: ratedId},
          },
        ],
      },
    });

    if (!approvedRequest) {
      return res.status(403).json({
        message: 'You can rate only after an approved trip.',
      });
    }

    // 4️⃣ Проверка за вече съществуващ rating
    const existingRating = await prisma.rating.findFirst({
      where: {
        routeId,
        raterId,
        ratedId,
      },
    });

    if (existingRating) {
      return res.status(400).json({
        message: 'You have already rated this user for this route.',
      });
    }

    // 🔥 5️⃣ Transaction (сигурност + консистентност)
    const result = await prisma.$transaction(async tx => {
      // Създаваме rating
      const newRating = await tx.rating.create({
        data: {
          routeId,
          raterId,
          ratedId,
          score,
          comment: comment || null,
        },
      });

      // Взимаме новото average по-ефективно
      const aggregate = await tx.rating.aggregate({
        where: {ratedId},
        _avg: {score: true},
      });

      const average = parseFloat((aggregate._avg.score || 0).toFixed(2));

      await tx.user.update({
        where: {id: ratedId},
        data: {averageRating: average},
      });

      // Update rate flags
      if (route.userId === raterId) {
        await tx.request.updateMany({
          where: {
            routeId,
            userID: ratedId,
          },
          data: {rateUser: true},
        });
      } else {
        await tx.request.updateMany({
          where: {
            routeId,
            userID: raterId,
          },
          data: {rateCreator: true},
        });
      }

      return {newRating, average};
    });

    return res.status(201).json({
      message: 'Rating submitted successfully.',
      rating: result.newRating,
      averageRating: result.average,
    });
  } catch (error) {
    console.error('Create rating error:', error);

    return res.status(500).json({
      message: 'Server error.',
    });
  }
};
