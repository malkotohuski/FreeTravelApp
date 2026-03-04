const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authenticateJWT');
const {submitBugReport} = require('../controllers/bugReportController');

router.post('/bug-reports', authenticateJWT, submitBugReport);

module.exports = router;
