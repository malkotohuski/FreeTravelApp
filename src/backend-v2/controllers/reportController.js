const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {sendReportStatusEmail} = require('../utils/mailer');

// POST /api/report
exports.sendReport = async (req, res) => {
  try {
    const {reportedUsername, text, image} = req.body;

    if (!reportedUsername || !text) {
      return res
        .status(400)
        .json({error: 'Reported username and text are required.'});
    }

    const reportedUser = await prisma.user.findUnique({
      where: {username: reportedUsername},
    });

    if (!reportedUser) {
      return res.status(404).json({error: 'User not found.'});
    }

    if (reportedUser.id === req.user.id) {
      return res.status(400).json({error: 'You cannot report yourself.'});
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reportsToday = await prisma.report.count({
      where: {
        reporterId: req.user.id,
        createdAt: {gte: today},
      },
    });

    if (reportsToday >= 3) {
      return res
        .status(429)
        .json({error: 'You can only submit 3 reports per day.'});
    }

    const report = await prisma.report.create({
      data: {
        text,
        image: image || null,
        reporterId: req.user.id,
        reportedId: reportedUser.id,
      },
    });

    return res.status(201).json({
      message: 'Report submitted successfully.',
      reportId: report.id,
    });
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({error: 'Internal Server Error'});
  }
};

// GET /api/report/all
exports.getAllReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {id: true, username: true, email: true},
        },
        reported: {
          select: {id: true, username: true, email: true},
        },
      },
      orderBy: {createdAt: 'desc'},
    });

    return res.status(200).json(reports);
  } catch (err) {
    console.error('Get reports error:', err);
    return res.status(500).json({error: 'Internal Server Error'});
  }
};

// PATCH /api/report/:id/status
exports.updateReportStatus = async (req, res) => {
  try {
    const {id} = req.params;
    const {status} = req.body;

    if (!['PENDING', 'RESOLVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({error: 'Invalid status value.'});
    }

    const reportId = parseInt(id, 10);
    if (Number.isNaN(reportId)) {
      return res.status(400).json({error: 'Invalid report ID.'});
    }

    const report = await prisma.report.findUnique({
      where: {id: reportId},
      include: {
        reporter: {select: {id: true, username: true, email: true}},
        reported: {select: {id: true, username: true, email: true}},
      },
    });

    if (!report) {
      return res.status(404).json({error: 'Report not found.'});
    }

    const updatedReport = await prisma.report.update({
      where: {id: reportId},
      data: {status},
      include: {
        reporter: {select: {id: true, username: true, email: true}},
        reported: {select: {id: true, username: true, email: true}},
      },
    });

    await sendReportStatusEmail(updatedReport, updatedReport.reporter.email);

    return res.status(200).json({
      message: 'Report status updated.',
      report: updatedReport,
    });
  } catch (err) {
    console.error('Update report status error:', err);
    return res.status(500).json({error: 'Internal Server Error'});
  }
};
