const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authenticateJWT');
const routeController = require('../controllers/routeController');

router.post('/', authenticateJWT, routeController.createRoute);
router.get('/', authenticateJWT, routeController.getActiveRoutes);

module.exports = router;
