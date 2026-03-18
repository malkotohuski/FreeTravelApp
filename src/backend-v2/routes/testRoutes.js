const express = require('express');
const {sendPush} = require('../services/fcmService');

const router = express.Router();

router.post('/push-test', async (req, res) => {
  const {token} = req.body;

  await sendPush(token, 'Test Push', 'Hello from FreeTravel 🚗');

  res.json({success: true});
});

module.exports = router;
