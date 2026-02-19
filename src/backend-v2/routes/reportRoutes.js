const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticateJWT = require('../middlewares/authenticateJWT');
const isAdmin = require('../middlewares/isAdmin');

const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
// POST /api/report
router.post('/', authenticateJWT, reportController.sendReport);

// GET /api/report/all - admin only
router.get('/admin/all', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: {select: {id: true, username: true, email: true}},
        reported: {select: {id: true, username: true, email: true}},
      },
      orderBy: {createdAt: 'desc'},
    });

    return res.json({reports}); // ако няма, ще върне { reports: [] }
  } catch (error) {
    console.error('Get all reports error:', error);
    return res.status(500).json({error: 'Internal server error'});
  }
});

// PATCH /api/report/:id/status - admin only
router.patch(
  '/:id/status',
  authenticateJWT,
  isAdmin,
  reportController.updateReportStatus,
);

module.exports = router;
