const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

exports.createComment = async (req, res) => {
  try {
    const {text, rating, authorId, recipientId, routeId} = req.body;

    // 1️⃣ Проверяваме дали маршрутът е completed
    const route = await prisma.route.findUnique({
      where: {id: routeId},
    });

    if (!route || route.status !== 'completed') {
      return res.status(400).json({error: 'Route is not completed yet.'});
    }

    // 2️⃣ Създаваме коментар
    await prisma.comment.create({
      data: {
        text,
        rating,
        authorId,
        recipientId,
        routeId,
      },
    });

    // 3️⃣ Пресмятаме нов average rating
    const ratings = await prisma.comment.aggregate({
      where: {recipientId},
      _avg: {rating: true},
    });

    await prisma.user.update({
      where: {id: recipientId},
      data: {
        averageRating: ratings._avg.rating || 0,
      },
    });

    res.status(201).json({message: 'Comment added successfully.'});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to create comment.'});
  }
};

exports.getCommentsForUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const comments = await prisma.comment.findMany({
      where: {recipientId: userId},
      include: {
        author: {
          select: {
            username: true,
            userImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to fetch comments.'});
  }
};
