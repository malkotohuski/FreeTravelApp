const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authenticateJWT = require('../middlewares/authenticateJWT');

router.post('/comments', authenticateJWT, commentController.createComment);
router.get('/comments/:userId', commentController.getCommentsForUser);

module.exports = router;
