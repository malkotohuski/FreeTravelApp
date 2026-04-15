const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

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
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            comment: true,
            score: true,
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

    return res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({error: 'Internal server error.'});
  }
};

exports.updateProfileData = async (req, res) => {
  try {
    const userId = req.user.id;
    const {fName, lName, email} = req.body;

    const updates = {};
    if (fName !== undefined) updates.fName = fName;
    if (lName !== undefined) updates.lName = lName;
    if (email !== undefined) {
      const existingEmail = await prisma.user.findUnique({
        where: {email},
      });

      if (existingEmail && existingEmail.id !== userId) {
        return res.status(400).json({error: 'Email already in use.'});
      }

      updates.email = email;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({error: 'No changes provided.'});
    }

    const updatedUser = await prisma.user.update({
      where: {id: userId},
      data: updates,
      select: {
        id: true,
        username: true,
        fName: true,
        lName: true,
        email: true,
        userImage: true,
        averageRating: true,
      },
    });

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({error: 'Server error.'});
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({error: 'No image file provided.'});
    }

    const user = await prisma.user.findUnique({where: {id: userId}});

    if (user.userImagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.userImagePublicId);
      } catch (error) {
        console.warn('Could not delete old avatar:', error.message);
      }
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      transformation: [
        {width: 300, height: 300, crop: 'fill'},
        {fetch_format: 'auto', quality: 'auto'},
      ],
    });

    fs.unlinkSync(req.file.path);

    const updatedUser = await prisma.user.update({
      where: {id: userId},
      data: {
        userImage: result.secure_url,
        userImagePublicId: result.public_id,
      },
      select: {id: true, userImage: true, userImagePublicId: true},
    });

    return res.status(200).json({
      message: 'Avatar updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    return res.status(500).json({error: 'Server error.'});
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const {currentPassword, newPassword} = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({error: 'Both current and new password are required.'});
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: 'New password must be different from current password.',
      });
    }

    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) {
      return res.status(404).json({error: 'User not found.'});
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({error: 'Current password is incorrect.'});
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({error: 'New password must be at least 8 characters.'});
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: {id: userId},
      data: {password: hashedPassword},
    });

    return res.status(200).json({message: 'Password changed successfully.'});
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({error: 'Server error.'});
  }
};

exports.softDeleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: {id: userId},
    });

    if (!user) {
      return res.status(404).json({error: 'User not found.'});
    }

    if (user.accountStatus === 'deleted') {
      return res.status(400).json({error: 'Account already deleted.'});
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        error: 'Your account has been deactivated.',
      });
    }

    await prisma.user.update({
      where: {id: userId},
      data: {
        accountStatus: 'deleted',
      },
    });

    return res.status(200).json({
      message: 'Account soft deleted successfully.',
    });
  } catch (error) {
    console.error('Soft delete error:', error);
    return res.status(500).json({error: 'Server error.'});
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {id: 'asc'},
      select: {
        id: true,
        username: true,
        email: true,
        fName: true,
        lName: true,
        accountStatus: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: 'Server error'});
  }
};
