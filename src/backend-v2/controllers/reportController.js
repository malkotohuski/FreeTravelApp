const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

// Helper функция за изпращане на email уведомление
async function sendStatusEmail(report, reporterEmail) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let message;
  let statusColor;

  if (report.status === 'RESOLVED') {
    message =
      'Your report has been reviewed and appropriate action has been taken.';
    statusColor = '#28a745'; // зелено
  } else if (report.status === 'REJECTED') {
    message = 'Your report has been reviewed but no violation was found.';
    statusColor = '#dc3545'; // червено
  } else {
    message = `Status updated to: ${report.status}`;
    statusColor = '#6c757d'; // сиво
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
        
        <h2 style="color: #333;">Report Status Update</h2>
        
        <p>Hello <strong>${report.reporter.username}</strong>,</p>
        
        <p>${message}</p>

        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <p><strong>Report ID:</strong> ${report.id}</p>
          <p><strong>Reported User:</strong> ${report.reported.username}</p>
          <p>
            <strong>Status:</strong> 
            <span style="color: ${statusColor}; font-weight: bold;">
              ${report.status}
            </span>
          </p>
        </div>

        <p style="font-size: 14px; color: #777;">
          If you have further concerns, feel free to contact support.
        </p>

        <hr style="margin: 25px 0;" />

        <p style="font-size: 12px; color: #999;">
          © ${new Date().getFullYear()} FreeTravelApp. All rights reserved.
        </p>

      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: reporterEmail,
    subject: `🚨 Report #${report.id} Status Updated`,
    text: message, // fallback plain text
    html: htmlContent, // красивият HTML
  });
}

// POST /api/report
exports.sendReport = async (req, res) => {
  try {
    const {reportedUsername, text, image} = req.body;

    if (!reportedUsername || !text) {
      return res
        .status(400)
        .json({error: 'Reported username and text are required.'});
    }

    // Намираме потребителя по username
    const reportedUser = await prisma.user.findUnique({
      where: {username: reportedUsername},
    });

    if (!reportedUser) {
      return res.status(404).json({error: 'User not found.'});
    }

    if (reportedUser.id === req.user.userId) {
      return res.status(400).json({error: 'You cannot report yourself.'});
    }

    // Rate limit – 2 на ден
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reportsToday = await prisma.report.count({
      where: {
        reporterId: req.user.userId,
        createdAt: {gte: today},
      },
    });

    if (reportsToday >= 2) {
      return res
        .status(429)
        .json({error: 'You can only submit 2 reports per day.'});
    }

    const report = await prisma.report.create({
      data: {
        text,
        image: image || null,
        reporterId: req.user.userId,
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

    const reportId = parseInt(id);
    if (isNaN(reportId)) {
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

    // ✨ Email уведомление към reporter
    await sendStatusEmail(updatedReport, updatedReport.reporter.email);

    return res.status(200).json({
      message: 'Report status updated.',
      report: updatedReport,
    });
  } catch (err) {
    console.error('Update report status error:', err);
    return res.status(500).json({error: 'Internal Server Error'});
  }
};
