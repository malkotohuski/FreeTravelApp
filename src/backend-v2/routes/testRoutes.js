const express = require('express');
const router = express.Router();
const {sendPush} = require('../services/fcmService');
const authenticateJWT = require('../middlewares/authenticateJWT');
const isAdmin = require('../middlewares/isAdmin');

router.post('/push-test', authenticateJWT, isAdmin, async (req, res) => {
  const {token} = req.body;

  if (!token) {
    return res.status(400).json({error: 'Token is required'});
  }

  await sendPush(token, 'Test Push', 'Hello from FreeTravel');

  return res.json({success: true});
});

module.exports = router;
