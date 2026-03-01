const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const authenticateJWT = require('../middlewares/authenticateJWT');

router.post('/', authenticateJWT, ratingController.createRating);

module.exports = router;
