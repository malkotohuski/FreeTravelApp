const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticateJWT = require('../middlewares/authenticateJWT');
const isAdmin = require('../middlewares/isAdmin');
const {
  submitBugReport,
  getAllBugReports,
  updateBugReportStatus,
} = require('../controllers/bugReportController');

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
router.get('/bug-reports/admin/all', authenticateJWT, isAdmin, getAllBugReports);
router.patch(
  '/bug-reports/:id/status',
  authenticateJWT,
  isAdmin,
  updateBugReportStatus,
);

module.exports = router;
