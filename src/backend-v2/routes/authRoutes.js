const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateJWT = require('../middlewares/authenticateJWT');
const multer = require('multer');

const upload = multer({
  dest: 'tmp/',
  limits: {fileSize: 5 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed.'));
    } else {
      cb(null, true);
    }
  },
});

router.post('/register', upload.single('avatar'), authController.register);
router.post('/confirm', authController.confirmEmail);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authenticateJWT, authController.logout);

// 🔄 refresh token
router.post('/refresh', authController.refreshToken);

module.exports = router;
