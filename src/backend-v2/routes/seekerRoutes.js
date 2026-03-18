const express = require('express');
const router = express.Router();
const seekerController = require('../controllers/seekerController');
const authenticateJWT = require('../middlewares/authenticateJWT');

router.post('/seekers', authenticateJWT, seekerController.createSeekerRequest);
router.get('/seekers', seekerController.getAllSeekers);
router.delete('/seekers/:id', authenticateJWT, seekerController.deleteSeeker);

module.exports = router;
