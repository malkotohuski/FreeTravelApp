const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        accountStatus: 'active',
      },
      select: {
        id: true,
        username: true,
        fName: true,
        lName: true,
        userImage: true,
        averageRating: true,

        receivedRatings: {
          where: {
            comment: {
              not: null,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            score: true,
            comment: true,
            createdAt: true,
            rater: {
              select: {
                id: true,
                username: true,
                userImage: true,
              },
            },
          },
        },

        _count: {
          select: {
            receivedRatings: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({error: 'Internal server error.'});
  }
};
