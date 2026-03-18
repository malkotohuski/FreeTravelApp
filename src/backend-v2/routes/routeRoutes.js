const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authenticateJWT');
const routeController = require('../controllers/routeController');

router.post('/', authenticateJWT, routeController.createRoute);
router.get('/', authenticateJWT, routeController.getActiveRoutes);

router.get('/my', authenticateJWT, routeController.getMyRoutes);

router.patch('/:id/complete', authenticateJWT, routeController.completeRoute);

router.patch('/:id/delete', authenticateJWT, routeController.deleteRoute);

module.exports = router;
