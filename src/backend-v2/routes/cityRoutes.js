const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');

router.get('/search', cityController.searchCities);

module.exports = router;
