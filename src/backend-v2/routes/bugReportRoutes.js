const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticateJWT = require('../middlewares/authenticateJWT');
const {submitBugReport} = require('../controllers/bugReportController');

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

router.post(
  '/bug-reports',
  authenticateJWT,
  upload.single('image'),
  submitBugReport,
);

module.exports = router;
