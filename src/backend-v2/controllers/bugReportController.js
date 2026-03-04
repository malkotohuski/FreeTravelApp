const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

exports.submitBugReport = async (req, res) => {
  try {
    const {
      title,
      description,
      steps,
      appVersion,
      platform,
      systemVersion,
      deviceModel,
      image, // ⚡ промяна: screenshot → image
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({error: 'Title is required'});
    }

    // ⚡ rate limit: максимум 2 на ден на потребител
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reportsToday = await prisma.bugReport.count({
      where: {
        userId: req.user.id,
        createdAt: {gte: today},
      },
    });

    if (reportsToday >= 2) {
      return res
        .status(429)
        .json({error: 'You can only submit 2 bug reports per day'});
    }

    const bugReport = await prisma.bugReport.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        description: description?.trim() || '',
        steps: steps?.trim() || '',
        image: image || null, // ⚡ тук се използва новото поле
        appVersion,
        platform,
        systemVersion,
        deviceModel,
      },
    });

    return res.status(201).json({
      message: 'Bug report submitted successfully',
      id: bugReport.id,
    });
  } catch (err) {
    console.error('Bug report error:', err);
    return res.status(500).json({error: 'Server error'});
  }
};
