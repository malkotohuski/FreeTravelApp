const express = require('express');
const router = express.Router();
const {PrismaClient} = require('@prisma/client');
const authenticateJWT = require('../middlewares/authenticateJWT');

const prisma = new PrismaClient();

router.post('/register-device', authenticateJWT, async (req, res) => {
  try {
    const {fcmToken} = req.body;

    if (!fcmToken) {
      return res.status(400).json({error: 'FCM token is required'});
    }

    const existingDevice = await prisma.userDevice.findFirst({
      where: {fcmToken},
      select: {id: true},
    });

    const device = existingDevice
      ? await prisma.userDevice.update({
          where: {id: existingDevice.id},
          data: {userId: req.user.id},
        })
      : await prisma.userDevice.create({
          data: {
            userId: req.user.id,
            fcmToken,
          },
        });

    return res.json(device);
  } catch (error) {
    console.error(error);
    return res.status(500).json({error: 'Failed to save device token'});
  }
});

module.exports = router;
