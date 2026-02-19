require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_later';

function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function deleteInactiveAccountsOlderThanOneDay() {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const yesterday = new Date(Date.now() - ONE_DAY);

  await prisma.user.deleteMany({
    where: {
      isActive: false,
      createdAt: {
        lt: yesterday,
      },
    },
  });

  console.log('Inactive accounts older than 1 day deleted.');
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
        fName: fName || '',
        lName: lName || '',
        userImage: userImage || '',
        confirmationCode,
        confirmationCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isActive: false,
        routes: [],
        friends: [],
        ratings: [],
        averageRating: 0,
        comments: [],
      },
    });

    // Email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        error: 'Email service is not configured.',
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: useremail,
      subject: 'Account Confirmation',
      text: `Your confirmation code is: ${confirmationCode}`,
    });

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
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return res.status(400).json({error: 'Email and password are required.'});
    }

    const user = await prisma.user.findFirst({
      where: {email},
    });

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({error: 'Invalid credentials or account not active.'});
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({error: 'Invalid credentials.'});
    }

    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      {expiresIn: '1d'},
    );

    const safeUser = {...user};
    delete safeUser.password;
    delete safeUser.confirmationCode;
    delete safeUser.confirmationCodeExpiresAt;

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({error: 'Internal server error.'});
  }
};
