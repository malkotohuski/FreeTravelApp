const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

exports.createComment = async (req, res) => {
  try {
    const {text, rating, recipientId, routeId} = req.body;
    const authorId = req.user.id;

    const route = await prisma.route.findUnique({
      where: {id: routeId},
      select: {
        id: true,
        status: true,
        ownerId: true,
      },
    });

    if (!route || route.status !== 'completed') {
      return res.status(400).json({error: 'Route is not completed yet.'});
    }

    if (authorId === recipientId) {
      return res.status(400).json({error: 'You cannot comment on yourself.'});
    }

    const approvedRequest = await prisma.request.findFirst({
      where: {
        routeId,
        status: 'approved',
        OR: [
          {
            userID: authorId,
            toUserId: recipientId,
          },
          {
            userID: recipientId,
            toUserId: authorId,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const validParticipants =
      approvedRequest &&
      (route.ownerId === authorId || route.ownerId === recipientId);

    if (!validParticipants) {
      return res.status(403).json({
        error: 'You can comment only after a completed approved trip.',
      });
    }

    await prisma.comment.create({
      data: {
        text,
        rating,
        authorId,
        recipientId,
        routeId,
      },
    });

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

    return res.status(201).json({message: 'Comment added successfully.'});
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: 'Failed to create comment.'});
  }
};

exports.getCommentsForUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);

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

    return res.json(comments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: 'Failed to fetch comments.'});
  }
};
