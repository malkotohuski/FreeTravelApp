const express = require('express');
const router = express.Router();
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

router.post('/register-device', async (req, res) => {
  console.log('REGISTER DEVICE BODY:', req.body);

  try {
    const {userId, fcmToken} = req.body;

    const device = await prisma.userDevice.create({
      data: {
        userId: Number(userId),
        fcmToken: fcmToken,
      },
    });

    res.json(device);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: 'Failed to save device token'});
  }
});

module.exports = router;
