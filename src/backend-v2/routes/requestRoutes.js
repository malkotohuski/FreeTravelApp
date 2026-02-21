const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authenticateJWT = require('../middlewares/authenticateJWT');

// Създаване на заявка
router.post(
  '/send-request-to-user',
  authenticateJWT,
  requestController.createRequest,
);

// Взимане на всички заявки
router.get('/requests', authenticateJWT, requestController.getAllRequests);

module.exports = router;
