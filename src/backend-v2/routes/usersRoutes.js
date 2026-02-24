const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.get('/:id', usersController.getUserById);

module.exports = router;
