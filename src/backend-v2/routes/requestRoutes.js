// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authenticateJWT = require('../middlewares/authenticateJWT');

router.post(
  '/requests/:id/decision',
  authenticateJWT,
  requestController.makeDecision,
);

router.get('/requests', authenticateJWT, requestController.getAllRequests);

router.post(
  '/send-request-to-user',
  authenticateJWT,
  requestController.createRequest,
);

module.exports = router;
