require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {Resend} = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const crypto = require('crypto');
const sendResetEmail = require('../utils/mailer');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_later';

function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function deleteInactiveAccountsOlderThanOneDay() {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const yesterday = new Date(Date.now() - ONE_DAY);

  const inactiveUsers = await prisma.user.findMany({
    where: {
      isActive: false,
      createdAt: {lt: yesterday},
    },
    select: {id: true},
  });

  const ids = inactiveUsers.map(u => u.id);
  if (ids.length === 0) return;

  // ✅ Изтривай в правилния ред — от дъщерни към родителски

  await prisma.report.deleteMany({
    where: {OR: [{reporterId: {in: ids}}, {reportedId: {in: ids}}]},
  });

  await prisma.notification.deleteMany({
    where: {OR: [{senderId: {in: ids}}, {recipientId: {in: ids}}]},
  });

  await prisma.message.deleteMany({
    where: {senderId: {in: ids}},
  });

  await prisma.conversation.deleteMany({
    where: {OR: [{user1Id: {in: ids}}, {user2Id: {in: ids}}]},
  });

  await prisma.request.deleteMany({
    where: {userID: {in: ids}},
  });

  await prisma.comment.deleteMany({
    where: {OR: [{authorId: {in: ids}}, {recipientId: {in: ids}}]},
  });

  await prisma.rating.deleteMany({
    where: {OR: [{raterId: {in: ids}}, {ratedId: {in: ids}}]},
  });

  await prisma.route.deleteMany({
    where: {ownerId: {in: ids}},
  });

  await prisma.userDevice.deleteMany({
    where: {userId: {in: ids}},
  });

  // ✅ Накрая изтриваме потребителите
  await prisma.user.deleteMany({
    where: {id: {in: ids}},
  });

  console.log(`Deleted ${ids.length} inactive accounts.`);
}

//register----------------------------------------------------------------->>> Регистрация !!!

exports.register = async (req, res) => {
  try {
    await deleteInactiveAccountsOlderThanOneDay();

    const {username, useremail, userpassword, fName, lName, userImage} =
      req.body;

    // 1️⃣ Basic validation
    if (!username || !useremail || !userpassword) {
      return res.status(400).json({
        error: 'Invalid input. Please provide all required fields.',
      });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(useremail)) {
      return res.status(400).json({
        error: 'Invalid email format.',
      });
    }

    // 2️⃣ Check existing active user
    const existingActiveUser = await prisma.user.findFirst({
      where: {
        OR: [{email: useremail}, {username: username}],
        isActive: true,
      },
    });

    if (existingActiveUser) {
      return res.status(400).json({
        error: 'Email or username is already taken by an active account.',
      });
    }

    // 3️⃣ Delete inactive duplicate
    await prisma.user.deleteMany({
      where: {
        OR: [{email: useremail}, {username: username}],
        isActive: false,
      },
    });

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(userpassword, SALT_ROUNDS);

    const confirmationCode = generateConfirmationCode();

    const newUser = await prisma.user.create({
      data: {
        username,
        email: useremail,
        password: hashedPassword,
        fName: fName || null,
        lName: lName || null,
        userImage: userImage || null,
        confirmationCode,
        confirmationCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isActive: false,
        friends: '[]', // Json поле като string
        averageRating: 0,
      },
    });

    try {
      await resend.emails.send({
        from: 'noreply@freetravelapp.it.com',
        to: useremail,
        subject: 'Account Confirmation - FreeTravelApp',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f4511e;">Добре дошъл в FreeTravelApp! 🚗</h2>
        <p>Твоят код за потвърждение е:</p>
        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #f4511e;
          text-align: center;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
          margin: 20px 0;
        ">
          ${confirmationCode}
        </div>
        <p style="color: #666;">Кодът е валиден 10 минути.</p>
        <p style="color: #999; font-size: 12px;">
          Ако не си правил регистрация — игнорирай този имейл.
        </p>
      </div>
    `,
      });
    } catch (err) {
      console.log('Email failed but user created:', err.message);
    }

    const safeUser = {...newUser};
    delete safeUser.password;
    delete safeUser.confirmationCode;
    delete safeUser.confirmationCodeExpiresAt;
    delete safeUser.lastConfirmationResend;

    return res.status(201).json({
      message:
        'Registration successful. Please check your email for the confirmation code.',
      user: safeUser,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({error: 'Internal server error.'});
  }
};

//confirmEmail----------------------------------------------------------------->>> Потвърждаване на имейл !!!

exports.confirmEmail = async (req, res) => {
  try {
    const {email, confirmationCode} = req.body;

    if (!email || !confirmationCode) {
      return res
        .status(400)
        .json({error: 'Email and confirmation code are required.'});
    }

    const user = await prisma.user.findFirst({
      where: {email, confirmationCode},
    });

    if (!user) {
      return res
        .status(400)
        .json({error: 'Invalid email or confirmation code.'});
    }

    // Проверка за изтичане на кода
    if (
      !user.confirmationCodeExpiresAt ||
      new Date() > user.confirmationCodeExpiresAt
    ) {
      return res.status(400).json({error: 'Confirmation code expired.'});
    }

    const updatedUser = await prisma.user.update({
      where: {id: user.id},
      data: {
        isActive: true,
        confirmationCode: null,
        confirmationCodeExpiresAt: null,
        lastConfirmationResend: null,
      },
    });

    const safeUser = {...updatedUser};
    delete safeUser.password;

    return res.status(200).json({
      message: 'Account confirmed successfully!',
      user: safeUser,
    });
  } catch (error) {
    console.error('Confirm email error:', error);
    return res.status(500).json({error: 'Internal server error.'});
  }
};

//Login----------------------------------------------------------------->>> Вход в системата !!!

exports.login = async (req, res) => {
  console.log('LOGIN ATTEMPT:', req.body.email);
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.',
      });
    }

    const user = await prisma.user.findFirst({
      where: {email},
    });

    if (!user) {
      return res.status(401).json({error: 'Invalid credentials.'});
    }

    if (user.accountStatus !== 'active') {
      console.log('ACCOUNT STATUS:', user.accountStatus);
      return res.status(403).json({
        error: 'Your account has been deactivated.',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({error: 'Invalid credentials.'});
    }

    // ✅ Генериране на краткосрочен access token (15 мин)
    const token = jwt.sign(
      {userId: user.id, isAdmin: user.isAdmin},
      JWT_SECRET,
      {expiresIn: '15m'},
    );

    // ✅ Генериране на дългосрочен refresh token
    const newRefreshToken = crypto.randomBytes(64).toString('hex');

    // ✅ Запис на refresh token в базата
    await prisma.user.update({
      where: {id: user.id},
      data: {
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // ✅ 30 дни
      },
    });

    // safeUser
    const safeUser = {...user};
    delete safeUser.password;
    delete safeUser.confirmationCode;
    delete safeUser.confirmationCodeExpiresAt;

    // ✅ връщане на response
    return res.status(200).json({
      message: 'Login successful!',
      accessToken: token,
      refreshToken: newRefreshToken,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error.',
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const {refreshToken} = req.body;

    if (!refreshToken) {
      return res.status(400).json({error: 'Refresh token is required.'});
    }

    const user = await prisma.user.findFirst({
      where: {refreshToken},
    });

    if (!user) {
      return res.status(401).json({error: 'Invalid refresh token.'});
    }

    // ✅ Провери дали е изтекъл
    if (user.refreshTokenExpiresAt < new Date()) {
      return res
        .status(401)
        .json({error: 'Refresh token expired. Please login again.'});
    }

    // ✅ Нов access token
    const newAccessToken = jwt.sign(
      {userId: user.id, isAdmin: user.isAdmin},
      JWT_SECRET,
      {expiresIn: '15m'},
    );

    // ✅ Нов refresh token (rotating)
    const newRefreshToken = crypto.randomBytes(64).toString('hex');

    // ✅ Запази новия refresh token в базата
    await prisma.user.update({
      where: {id: user.id},
      data: {
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // ✅ 30 дни
      },
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // ✅ върни го на клиента
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({error: 'Internal server error.'});
  }
};

exports.logout = async (req, res) => {
  try {
    await prisma.user.update({
      where: {id: req.user.id},
      data: {
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
    });

    return res.status(200).json({message: 'Logged out successfully.'});
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({error: 'Internal server error.'});
  }
};

exports.forgotPassword = async (req, res) => {
  console.log('✅ forgotPassword called with email:', req.body.email);
  try {
    const {email} = req.body;

    const user = await prisma.user.findUnique({where: {email}});

    // Винаги security response
    if (!user) {
      return res
        .status(200)
        .json({message: 'If account exists, reset code sent.'});
    }

    // Генериране на 6-цифрен код
    const plainCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash-ване
    const hashedCode = await bcrypt.hash(plainCode, 12);

    // Запис в DB
    await prisma.user.update({
      where: {id: user.id},
      data: {
        confirmationCode: hashedCode,
        confirmationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 мин
      },
    });

    // Изпращане на имейл чрез utils/mailer
    try {
      console.log('Sending reset code to:', email, 'Code:', plainCode);
      await sendResetEmail(email, plainCode);
      console.log('Email sent!');
    } catch (err) {
      console.error('Error sending reset email:', err);
    }

    return res
      .status(200)
      .json({message: 'If account exists, reset code sent.'});
  } catch (error) {
    console.error('Forgot password error:', error);
    return res
      .status(200)
      .json({message: 'If account exists, reset code sent.'});
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const {email, code, newPassword} = req.body;

    const user = await prisma.user.findUnique({where: {email}});
    if (!user || !user.confirmationCode || !user.confirmationCodeExpiresAt) {
      return res.status(400).json({error: 'Invalid or expired code.'});
    }

    if (new Date() > user.confirmationCodeExpiresAt) {
      return res.status(400).json({error: 'Code expired.'});
    }

    const isCodeValid = await bcrypt.compare(code, user.confirmationCode);
    if (!isCodeValid) {
      return res.status(400).json({error: 'Invalid code.'});
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {id: user.id},
      data: {
        password: hashedPassword,
        confirmationCode: null,
        confirmationCodeExpiresAt: null,
      },
    });

    return res.status(200).json({message: 'Password reset successful.'});
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({error: 'Internal server error.'});
  }
};
