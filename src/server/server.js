const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12; // Number of salt rounds for bcrypt
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const authenticateJWT = require('./jwtMiddleware');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_later';
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Enable CORS, bodyParser and other middlewares
server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use(
  cors({
    origin: '*', // Разреши всички източници
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }),
);

// Function to generate a random confirmation code
function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Handle user registration
server.post('/register', async (req, res) => {
  deleteInactiveAccountsOlderThanOneDay();

  const {username, useremail, userpassword, fName, lName, userImage, routes} =
    req.body;

  console.log('Registration Request:', {
    username,
    useremail,
    userpasswordLength: userpassword?.length,
    fName,
    lName,
    userImage,
    routes,
  });

  // 1️⃣ Базова валидация
  if (!username || !useremail || !userpassword) {
    return res
      .status(400)
      .json({error: 'Invalid input. Please provide all required fields.'});
  }

  // 2️⃣ Валидация на email формата
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(useremail)) {
    return res.status(400).json({
      error: 'Invalid email format.',
    });
  }

  // Проверка за вече активен потребител
  const existingActiveUser = router.db
    .get('users')
    .find(
      user =>
        (user.email === useremail || user.username === username) &&
        user.isActive === true,
    )
    .value();

  if (existingActiveUser) {
    return res.status(400).json({
      error: 'Email or username is already taken by an active account.',
    });
  }

  // Изтриване на неактивен потребител със същия email/username
  const existingInactiveUser = router.db
    .get('users')
    .find(
      user =>
        (user.email === useremail || user.username === username) &&
        user.isActive === false,
    )
    .value();

  if (existingInactiveUser) {
    router.db.get('users').remove({id: existingInactiveUser.id}).write();
  }

  // ❗ Хеширане на паролата
  const hashedPassword = await bcrypt.hash(userpassword, SALT_ROUNDS);

  // Генериране на confirmation code
  const confirmationCode = generateConfirmationCode();

  // Създаваме юзъра
  const user = {
    id: Date.now(),
    username,
    email: useremail,
    password: hashedPassword,
    fName: fName || '',
    lName: lName || '',
    userImage: userImage || '',
    confirmationCode: confirmationCode.toString(),
    confirmationCodeExpiresAt: Date.now() + 10 * 60 * 1000, // ⏱ 10 минути
    lastConfirmationResend: null,
    isActive: false,
    createdAt: Date.now(),
    routes: [],
    friends: [],
    ratings: [],
    averageRating: 0,
    comments: [],
    accountStatus: 'active',
  };

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({
      error: 'Email service is not configured.',
    });
  }

  // Записваме юзъра
  router.db.get('users').push(user).write();

  // Изпращаме confirmation email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,

    to: useremail,
    subject: 'Account Confirmation',
    text: `Your confirmation code is: ${confirmationCode}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Email confirmation error:', error);
      return res
        .status(500)
        .json({error: 'Failed to send confirmation email.'});
    } else {
      console.log('Email confirmation sent:', info.response);

      // ❌ Връщаме потребителя без парола
      const safeUser = {...user};
      delete safeUser.password;
      delete safeUser.confirmationCode;
      delete safeUser.confirmationCodeExpiresAt;
      delete safeUser.lastConfirmationResend;

      return res.status(201).json({
        message:
          'Registration successful. Please check your email for the confirmation code.',
        user: safeUser,
      });
    }
  });
});

function deleteInactiveAccountsOlderThanOneDay() {
  const now = Date.now();
  const users = router.db.get('users').value();

  const activeUsers = users.filter(user => {
    if (!user.isActive && user.createdAt) {
      const age = now - user.createdAt;
      const ONE_DAY = 24 * 60 * 60 * 1000;
      return age < ONE_DAY;
    }
    return true;
  });

  router.db.set('users', activeUsers).write();
  console.log('Inactive accounts older than 1 day have been deleted.');
}

server.post('/delete-account', authenticateJWT, (req, res) => {
  try {
    const userId = req.user.id; // ✅ идва от JWT

    const user = router.db.get('users').find({id: userId}).value();

    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }

    if (user.accountStatus === 'deleted') {
      return res.status(400).json({error: 'Account already deleted'});
    }

    router.db
      .get('users')
      .find({id: userId})
      .assign({
        accountStatus: 'deleted',
        isActive: false,
        deletedAt: Date.now(),
      })
      .write();

    return res.json({
      success: true,
      message: 'User marked as deleted',
    });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({error: 'Server error'});
  }
});

server.post('/restore-account', authenticateJWT, (req, res) => {
  const userId = req.user.id; // ✅ от JWT

  const user = router.db.get('users').find({id: userId}).value();

  if (!user) {
    return res.status(404).json({error: 'User not found.'});
  }

  if (user.accountStatus !== 'deleted') {
    return res.status(400).json({error: 'Account is not deleted.'});
  }

  router.db
    .get('users')
    .find({id: userId})
    .assign({
      accountStatus: 'active',
      isActive: true,
      deletedAt: null,
    })
    .write();

  return res.status(200).json({message: 'Account restored successfully.'});
});

server.post('/resend-confirmation-code', (req, res) => {
  const {email} = req.body;

  if (!email) {
    return res.status(400).json({error: 'Email is required.'});
  }

  const user = router.db.get('users').find({email}).value();

  if (!user) {
    return res.status(404).json({error: 'User not found.'});
  }

  if (user.isActive) {
    return res.status(400).json({error: 'Account is already confirmed.'});
  }

  // ⏱ Anti-spam: 1 минута между resend-и
  if (
    user.lastConfirmationResend &&
    Date.now() - user.lastConfirmationResend < 60 * 1000
  ) {
    return res
      .status(429)
      .json({error: 'Please wait before requesting a new code.'});
  }

  const newCode = generateConfirmationCode();

  router.db
    .get('users')
    .find({email})
    .assign({
      confirmationCode: newCode.toString(), // ✅ пазим като string
      confirmationCodeExpiresAt: Date.now() + 10 * 60 * 1000, // 10 минути
      lastConfirmationResend: Date.now(),
    })
    .write();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'New confirmation code',
    text: `Your new confirmation code is: ${newCode}`,
  };

  transporter.sendMail(mailOptions, error => {
    if (error) {
      console.error('Resend confirmation code error:', error);
      return res
        .status(500)
        .json({error: 'Failed to resend confirmation code.'});
    }

    return res.status(200).json({message: 'New confirmation code sent.'});
  });
});

server.patch('/user-changes', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {fName, lName, currentPassword, newPassword, userImage} = req.body;

    const user = router.db.get('users').find({id: userId}).value();
    if (!user) {
      return res.status(404).json({error: 'User not found.'});
    }

    // 🔐 Смяна на парола
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({error: 'Current password is required.'});
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({error: 'Current password is incorrect.'});
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      router.db
        .get('users')
        .find({id: userId})
        .assign({password: hashedNewPassword})
        .write();
    }

    // ✏️ Данни
    const updatedData = {};
    if (fName !== undefined) updatedData.fName = fName;
    if (lName !== undefined) updatedData.lName = lName;
    if (userImage) updatedData.userImage = userImage;

    router.db.get('users').find({id: userId}).assign(updatedData).write();

    const updatedUser = router.db.get('users').find({id: userId}).value();

    const safeUser = {...updatedUser};
    delete safeUser.password;

    return res.status(200).json({
      message: 'User profile updated successfully.',
      user: safeUser,
    });
  } catch (err) {
    console.error('User changes error:', err);
    return res.status(500).json({error: 'Server error'});
  }
});

server.post('/create-route', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const {route} = req.body;

  if (!route) {
    return res.status(400).json({error: 'Missing route data'});
  }

  const user = router.db.get('users').find({id: userId}).value();
  if (!user) return res.status(404).json({error: 'User not found'});

  const NOW = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  // Инициализираме масива ако го няма
  if (!Array.isArray(user.routeTimestamps)) user.routeTimestamps = [];

  // Филтрираме само последния час
  user.routeTimestamps = user.routeTimestamps.filter(ts => NOW - ts < ONE_HOUR);

  // Проверка за максимум 3 маршрута
  if (user.routeTimestamps.length >= 3) {
    return res.status(429).json({
      error: `Rate limit exceeded. You can create up to 3 routes per hour. Try again later.`,
    });
  }

  // Създаваме маршрута
  const newRoute = {
    ...route,
    id: Date.now(),
    ownerId: userId,
    createdAt: NOW,
    status: 'active',
  };

  router.db.get('routes').push(newRoute).write();

  // Добавяме текущия timestamp в масива
  router.db
    .get('users')
    .find({id: userId})
    .assign({
      routeTimestamps: [...user.routeTimestamps, NOW],
    })
    .write();

  return res.status(201).json({
    message: 'Route created successfully.',
    route: newRoute,
  });
});

server.post('/seekers-route', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const {seeker} = req.body;

  if (!seeker) {
    return res.status(400).json({error: 'Missing seeker data'});
  }

  const user = router.db.get('users').find({id: userId}).value();
  if (!user) return res.status(404).json({error: 'User not found'});

  const NOW = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  // Инициализираме масива ако го няма
  if (!Array.isArray(user.seekerTimestamps)) user.seekerTimestamps = [];

  // Филтрираме само последния час
  user.seekerTimestamps = user.seekerTimestamps.filter(
    ts => NOW - ts < ONE_HOUR,
  );

  // Проверка за максимум 3 заявки
  if (user.seekerTimestamps.length >= 3) {
    return res.status(429).json({
      error: `Rate limit exceeded. You can create up to 3 seeker routes per hour. Try again later.`,
    });
  }

  // Създаваме заявката за търсене на маршрут
  const newSeekerRoute = {
    ...seeker,
    id: Date.now(),
    seekerId: userId,
    createdAt: NOW,
    status: 'active',
  };

  router.db.get('seekers').push(newSeekerRoute).write();

  // Добавяме текущия timestamp в масива
  router.db
    .get('users')
    .find({id: userId})
    .assign({
      seekerTimestamps: [...user.seekerTimestamps, NOW],
    })
    .write();

  return res.status(201).json({
    message: 'Seeker route created successfully.',
    seeker: newSeekerRoute,
  });
});

server.post('/approve-friend-request', (req, res) => {
  const {userId, friendId} = req.body;

  // Намери потребителя и приятеля в базата данни
  const user = router.db.get('users').find({id: userId}).value();
  const friend = router.db.get('users').find({id: friendId}).value();

  if (!user || !friend) {
    return res.status(404).json({error: 'User or friend not found.'});
  }

  // Добави приятеля в масива friends на потребителя
  router.db
    .get('users')
    .find({id: userId})
    .assign({friends: [...user.friends, friend]})
    .write();

  // Изтрий заявката от масива requests
  router.db.get('requests').remove({userId, friendId}).write();

  return res
    .status(200)
    .json({message: 'Friend request approved successfully.'});
});

// Verification endpoint
server.post('/confirm', (req, res) => {
  const {email, confirmationCode} = req.body;

  if (!email || !confirmationCode) {
    return res.status(400).json({
      error: 'Email and confirmation code are required.',
    });
  }

  const emailClean = email.trim().toLowerCase();
  const user = router.db.get('users').find({email: emailClean}).value();

  if (!user) {
    return res.status(404).json({error: 'User not found.'});
  }

  if (user.isActive) {
    return res.status(400).json({error: 'Account already confirmed.'});
  }

  // ✅ Проверка на confirmation code (консистентно като string)
  if (user.confirmationCode !== confirmationCode.toString()) {
    return res.status(400).json({error: 'Invalid confirmation code.'});
  }

  // Проверка за изтичане на кода
  if (
    !user.confirmationCodeExpiresAt ||
    Date.now() > user.confirmationCodeExpiresAt
  ) {
    return res.status(400).json({error: 'Confirmation code expired.'});
  }

  // Активиране на акаунта
  router.db
    .get('users')
    .find({email})
    .assign({
      isActive: true,
      confirmationCode: null,
      confirmationCodeExpiresAt: null,
      lastConfirmationResend: null,
    })
    .write();

  return res.status(200).json({message: 'Account confirmed successfully.'});
});

// New endpoint to send a request to the "imala" server

server.post('/send-request-to-email', async (req, res) => {
  try {
    const {email, text, image} = req.body;

    // Проверка на задължителни полета
    if (!email || !text || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Email and text are required.',
      });
    }

    // Ограничаваме текста до 2000 символа
    if (text.length > 2000) {
      return res
        .status(400)
        .json({error: 'Text too long. Max 2000 characters.'});
    }

    // Почистен email
    const emailClean = email.trim().toLowerCase();

    // Взимаме потребителя
    const user = router.db.get('users').find({email: emailClean}).value();
    if (!user) {
      return res.status(404).json({error: 'User not found.'});
    }

    // Проверка на image size (макс 5MB)
    if (image) {
      const sizeInBytes =
        (image.length * 3) / 4 - (image.endsWith('==') ? 2 : 0);
      if (sizeInBytes > 5 * 1024 * 1024) {
        return res.status(400).json({error: 'Image too large. Max 5MB.'});
      }
    }

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Почистване на текст за HTML (escape)
    const escapeHtml = str =>
      str.replace(
        /[&<>"'`=\/]/g,
        s =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '`': '&#x60;',
            '=': '&#x3D;',
            '/': '&#x2F;',
          }[s]),
      );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailClean,
      subject: '🚨 New Report Received',
      text: `Hello ${user.username},\n\n${text}`,
      html: `
        <p>📛 <strong>New Report Received</strong></p>
        <p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>
        <p><strong>Attached image:</strong></p>
        ${
          image
            ? '<p>See attached file below.</p>'
            : '<p>No image provided.</p>'
        }
      `,
      attachments: image
        ? [
            {
              filename: image.startsWith('data:video')
                ? 'report-video.mp4'
                : 'report-image.jpg',
              content: image.split(',')[1],
              encoding: 'base64',
            },
          ]
        : [],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email send error:', error);
        return res.status(500).json({error: 'Failed to send email.'});
      }

      return res.status(200).json({message: 'Email sent successfully.'});
    });
  } catch (err) {
    console.error('Send request error:', err);
    return res.status(500).json({error: 'Internal Server Error'});
  }
});

// New endpoint to handle route approval
// Updated endpoint to handle route request approval or rejection
server.post('/send-request-to-user', (req, res) => {
  const {requestingUser} = req.body;

  // 1. Проверки
  if (!requestingUser) {
    return res.status(400).json({error: 'Requesting user is undefined.'});
  }

  if (!requestingUser.routeId) {
    return res.status(400).json({error: 'Route ID is missing.'});
  }

  if (!requestingUser.userID) {
    return res.status(400).json({error: 'User ID is missing.'});
  }

  // 2. Намираме маршрута
  const route = router.db
    .get('routes')
    .find({id: requestingUser.routeId})
    .value();

  if (!route) {
    return res.status(404).json({error: 'Route not found.'});
  }

  // 3. Проверка за дублирана заявка
  const existingRequest = router.db
    .get('requests')
    .find({
      routeId: requestingUser.routeId,
      userID: requestingUser.userID,
    })
    .value();

  if (existingRequest) {
    return res
      .status(400)
      .json({error: 'You have already submitted a request for this route.'});
  }

  // 4. Записваме заявката
  const newRequest = {
    ...requestingUser,
    id: Date.now(),
    rateCreator: false,
    rateUser: false,
  };

  router.db.get('requests').push(newRequest).write();

  // 5. Създаваме notification (СЛЕД като имаме route)
  const notification = {
    id: Date.now(),
    recipient: route.username, // ✅ вече е OK
    routeId: requestingUser.routeId,
    message: `You have a candidate for your route: ${requestingUser.departureCity}-${requestingUser.arrivalCity}`,
    requester: {
      username: requestingUser.username,
      userFname: requestingUser.userFname,
      userLname: requestingUser.userLname,
      email: requestingUser.userEmail,
      comment: requestingUser.requestComment,
    },
    createdAt: new Date().toISOString(),
    read: false,
    status: 'active',
  };

  router.db.get('notifications').push(notification).write();

  return res.status(200).json({
    message: 'Route request processed successfully.',
  });
});

server.post('/requests/:id/decision', authenticateJWT, async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const {decision} = req.body; // 'approved' | 'rejected'
    const decisionByUserId = req.user.id;

    // 1️⃣ Validate input
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        error: 'Invalid decision value.',
      });
    }

    const db = router.db;

    // 2️⃣ Find request
    const request = db.get('requests').find({id: requestId}).value();

    if (!request) {
      return res.status(404).json({
        error: 'Request not found.',
      });
    }

    // 3️⃣ Authorization (само owner на маршрута)
    if (request.userRouteId !== decisionByUserId) {
      return res.status(403).json({
        error: 'You are not allowed to process this request.',
      });
    }

    // 4️⃣ Idempotency (не може второ решение)
    if (request.status === 'approved' || request.status === 'rejected') {
      return res.status(409).json({
        error: 'Request already processed.',
        status: request.status,
      });
    }

    // 5️⃣ Update request status (atomic intent)
    db.get('requests')
      .find({id: requestId})
      .assign({
        status: decision,
        decidedAt: new Date().toISOString(),
      })
      .write();

    // 6️⃣ Prepare notification message
    const dateObj = new Date(request.dataTime);
    const formattedDate = `${dateObj.toLocaleDateString(
      'bg-BG',
    )} ${dateObj.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const notificationMessage =
      decision === 'approved'
        ? `Your request was approved.
Route: ${request.departureCity}-${request.arrivalCity}
Date: ${formattedDate}`
        : `Your request was rejected.
Route: ${request.departureCity}-${request.arrivalCity}
Date: ${formattedDate}`;

    // 7️⃣ Save notification (non-blocking for decision)
    db.get('notifications')
      .push({
        id: Date.now(),
        recipient: request.username, // кандидатът
        routeId: request.routeId,
        message: notificationMessage,
        requester: {
          userId: decisionByUserId,
        },
        createdAt: new Date().toISOString(),
        read: false,
        status: 'active',
        type: 'route-decision',
      })
      .write();

    // 8️⃣ Email (best-effort)
    try {
      await fetch('http://localhost:3000/send-request-to-email', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: request.userEmail,
          text:
            decision === 'approved'
              ? 'Your route request has been approved.'
              : 'Your route request has been rejected.',
        }),
      });
    } catch (err) {
      console.warn('⚠️ Email failed, decision already saved.');
    }

    // 9️⃣ Success
    return res.status(200).json({
      message: 'Decision processed successfully.',
      requestId,
      decision,
      routeId: request.routeId,
      candidateUserId: request.userID,
    });
  } catch (err) {
    console.error('❌ Decision endpoint error:', err);
    return res.status(500).json({
      error: 'Internal server error.',
    });
  }
});

// New endpoint to get all requests
server.get('/get-requests', (req, res) => {
  res.send('Server is up and running!');
  const {request} = req.body;
  const requestingUser = {...request, id: Date.now()};
  router.db.get('requests').push(requestingUser).write();

  return res
    .status(201)
    .json({message: 'Route created successfully.', request: requestingUser});
});

server.post('/rateUser', authenticateJWT, (req, res) => {
  try {
    const {userId, routeId, stars, comment} = req.body;
    const fromUserId = req.user.id;

    // 1️⃣ Basic validation
    if (!userId || !routeId || typeof stars !== 'number') {
      return res.status(400).json({
        error: 'Missing or invalid fields.',
      });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({
        error: 'Stars must be between 1 and 5.',
      });
    }

    if (userId === fromUserId) {
      return res.status(400).json({
        error: 'You cannot rate yourself.',
      });
    }

    // 2️⃣ Validate users
    const ratedUser = router.db.get('users').find({id: userId}).value();

    if (!ratedUser) {
      return res.status(404).json({
        error: 'User not found.',
      });
    }

    // 3️⃣ Check route exists
    const route = router.db.get('routes').find({id: routeId}).value();

    if (!route) {
      return res.status(404).json({
        error: 'Route not found.',
      });
    }

    // 3.5️⃣ Validate approved request between users
    const request = router.db
      .get('requests')
      .find({
        routeId,
        userID: fromUserId,
        status: 'approved',
      })
      .value();

    if (!request) {
      return res.status(403).json({
        error: 'You can rate users only after an approved trip.',
      });
    }

    // 4️⃣ Prevent duplicate rating for SAME ROUTE
    const alreadyRated = ratedUser.ratings?.find(
      r => r.fromUserId === fromUserId && r.routeId === routeId,
    );

    if (alreadyRated) {
      return res.status(400).json({
        error: 'You have already rated this user for this route.',
      });
    }

    // 5️⃣ Create rating
    const rating = {
      id: Date.now(),
      fromUserId,
      routeId,
      stars,
      comment: comment?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    // 6️⃣ Save rating
    if (!ratedUser.ratings) {
      ratedUser.ratings = [];
    }

    ratedUser.ratings.push(rating);

    // 7️⃣ Recalculate average rating
    const totalStars = ratedUser.ratings.reduce((sum, r) => sum + r.stars, 0);

    ratedUser.averageRating = parseFloat(
      (totalStars / ratedUser.ratings.length).toFixed(1),
    );

    router.db
      .get('users')
      .find({id: userId})
      .assign({
        ratings: ratedUser.ratings,
        averageRating: ratedUser.averageRating,
      })
      .write();

    return res.status(200).json({
      message: 'Rating submitted successfully.',
      averageRating: ratedUser.averageRating,
    });
  } catch (err) {
    console.error('Rate user error:', err);
    return res.status(500).json({
      error: 'Server error.',
    });
  }
});

// Handle user login
server.post('/login', async (req, res) => {
  const {useremail, userpassword} = req.body;

  try {
    const user = router.db.get('users').find({email: useremail}).value();

    if (!user) {
      return res.status(401).json({error: 'Invalid email or password'});
    }

    if (!user.password) {
      return res.status(500).json({error: 'User password is missing'});
    }

    const isMatch = await bcrypt.compare(userpassword, user.password);
    if (!isMatch) {
      return res.status(401).json({error: 'Invalid email or password'});
    }

    if (user.accountStatus === 'deleted') {
      return res.status(403).json({
        error: 'Account is deleted. Please contact support.',
      });
    }

    if (user.confirmationCode) {
      return res.status(403).json({
        error: 'Account not confirmed.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({error: 'Account is not active yet.'});
    }

    // 🔐 JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {expiresIn: '7d'},
    );

    const safeUser = {...user};
    delete safeUser.password;

    return res.status(200).json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({error: 'Server error'});
  }
});

// Custom route for fetching notifications for a specific user
server.get('/notifications/:username', (req, res) => {
  const {username} = req.params;
  const db = router.db; // Access to the lowdb instance
  const notifications = db
    .get('notifications')
    .filter({recipient: username})
    .value();
  res.json(notifications);
});

server.post('/forgot-password', (req, res) => {
  const {email} = req.body;

  const user = router.db.get('users').find({email}).value();

  if (!user) {
    return res.status(404).json({error: 'User not found'});
  }

  // 6-цифрен код
  const resetCode = Math.floor(100000 + Math.random() * 900000);

  // валиден 15 минути
  const expiresAt = Date.now() + 15 * 60 * 1000;

  router.db
    .get('users')
    .find({email})
    .assign({
      resetPasswordCode: resetCode,
      resetPasswordExpires: expiresAt,
    })
    .write();

  // email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.sendMail(
    {
      from: process.env.EMAIL_USER,

      to: email,
      subject: 'Password reset code',
      text: `Your password reset code is: ${resetCode}`,
    },
    error => {
      if (error) {
        console.error(error);
        return res.status(500).json({error: 'Email failed'});
      }

      return res.status(200).json({
        message: 'Reset code sent',
      });
    },
  );
});

server.post('/reset-password', async (req, res) => {
  const {email, code, newPassword} = req.body;

  const user = router.db.get('users').find({email}).value();

  if (!user) {
    return res.status(404).json({error: 'User not found'});
  }

  if (
    !user.resetPasswordCode ||
    user.resetPasswordCode !== parseInt(code, 10)
  ) {
    return res.status(400).json({error: 'Invalid reset code'});
  }

  if (Date.now() > user.resetPasswordExpires) {
    return res.status(400).json({error: 'Reset code expired'});
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  router.db
    .get('users')
    .find({email})
    .assign({
      password: hashedPassword,
      resetPasswordCode: null,
      resetPasswordExpires: null,
    })
    .write();

  return res.status(200).json({
    message: 'Password reset successful',
  });
});

server.patch('/routes/:id/complete', (req, res) => {
  const routeId = Number(req.params.id);
  const {userId, role} = req.body;
  // role = 'creator' | 'passenger'

  const route = router.db.get('routes').find({id: routeId}).value();

  if (!route) {
    return res.status(404).json({error: 'Route not found'});
  }

  // 🧱 Guard: ако вече е завършен
  if (route.status === 'completed') {
    return res.status(400).json({error: 'Route already completed'});
  }

  // ==========================
  // 👤 PASSENGER COMPLETION
  // ==========================
  if (role === 'passenger') {
    const passenger = route.passengers?.find(p => p.userId === userId);

    if (!passenger) {
      return res
        .status(403)
        .json({error: 'You are not a passenger on this route'});
    }

    passenger.completed = true;

    router.db
      .get('routes')
      .find({id: routeId})
      .assign({passengers: route.passengers})
      .write();

    return res.json({message: 'Passenger completed route'});
  }

  // ==========================
  // 🚗 CREATOR COMPLETION
  // ==========================
  if (role === 'creator') {
    // ❌ няма пътници
    if (!route.passengers || route.passengers.length === 0) {
      return res.status(400).json({
        error: 'Route cannot be completed without passengers',
      });
    }

    // ❌ не всички пътници са завършили
    const allPassengersCompleted = route.passengers.every(
      p => p.completed === true,
    );

    if (!allPassengersCompleted) {
      return res.status(400).json({
        error: 'All passengers must complete the route first',
      });
    }

    // ✅ OK → завършваме
    router.db
      .get('routes')
      .find({id: routeId})
      .assign({
        creatorCompleted: true,
        status: 'completed',
        completedAt: Date.now(),
      })
      .write();

    return res.json({message: 'Route completed successfully'});
  }

  return res.status(400).json({error: 'Invalid role'});
});

// Use default router
server.use(router);

const port = process.env.PORT || 3000;
const host = '0.0.0.0';
server.listen(port, host, () => {
  console.log(`JSON Server is running on http://${host}:${port}`);
});
