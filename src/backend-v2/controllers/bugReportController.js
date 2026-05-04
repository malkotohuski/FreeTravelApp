const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

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
      image,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({error: 'Title is required'});
    }

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

    let imageUrl = image || null;

    if (req.file?.path) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'bug-reports',
        resource_type: 'image',
        transformation: [{fetch_format: 'auto', quality: 'auto'}],
      });

      imageUrl = uploadResult.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const bugReport = await prisma.bugReport.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        description: description?.trim() || '',
        steps: steps?.trim() || '',
        image: imageUrl,
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
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Bug report error:', err);
    return res.status(500).json({error: 'Server error'});
  }
};
