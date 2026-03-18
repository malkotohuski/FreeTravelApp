const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authenticateJWT');
const usersController = require('../controllers/usersController');
const multer = require('multer');

const upload = multer({
  dest: 'tmp/',
  limits: {fileSize: 5 * 1024 * 1024}, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed.'));
    } else {
      cb(null, true);
    }
  },
});

router.get('/:id', usersController.getUserById);
router.patch('/profile', authenticateJWT, usersController.updateProfileData);
router.patch(
  '/avatar',
  authenticateJWT,
  upload.single('avatar'),
  usersController.updateAvatar,
);
router.patch('/password', authenticateJWT, usersController.changePassword);

router.patch(
  '/delete-account',
  authenticateJWT,
  usersController.softDeleteAccount,
);

module.exports = router;
