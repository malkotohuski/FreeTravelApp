const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authenticateJWT');
const routeController = require('../controllers/routeController');

router.post('/', authenticateJWT, routeController.createRoute);

module.exports = router;
