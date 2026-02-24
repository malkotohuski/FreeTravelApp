const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        accountStatus: 'active', // 👈 soft delete защита
      },
      select: {
        id: true,
        username: true,
        fName: true,
        lName: true,
        userImage: true,
        averageRating: true,
        receivedComments: {
          orderBy: {createdAt: 'desc'},
          select: {
            id: true,
            text: true,
            rating: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                username: true,
                userImage: true,
              },
            },
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
