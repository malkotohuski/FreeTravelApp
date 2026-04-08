const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateJWT = require('../middlewares/authenticateJWT');

router.post('/register', authController.register);
router.post('/confirm', authController.confirmEmail);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authenticateJWT, authController.logout);

// 🔄 refresh token
router.post('/refresh', authController.refreshToken);

module.exports = router;
