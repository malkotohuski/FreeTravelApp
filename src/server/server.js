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

  // Валидация
  if (!username || !useremail || !userpassword) {
    return res
      .status(400)
      .json({error: 'Invalid input. Please provide all required fields.'});
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

  // Записваме юзъра
  router.db.get('users').push(user).write();

  // Изпращаме confirmation email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'malkotohuski@gmail.com',
      pass: 'ymnayjeocfmplvwb',
    },
  });

  const mailOptions = {
    from: 'malkotohuski@gmail.com',
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

      return res.status(201).json({user: safeUser, confirmationCode});
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
    return res.status(400).json({
      error: 'Account is already confirmed.',
    });
  }

  // ⏱️ Anti-spam: 1 минута между resend-и
  if (
    user.lastConfirmationResend &&
    Date.now() - user.lastConfirmationResend < 60 * 1000
  ) {
    return res.status(429).json({
      error: 'Please wait before requesting a new code.',
    });
  }

  const newCode = generateConfirmationCode();

  router.db
    .get('users')
    .find({email})
    .assign({
      confirmationCode: newCode,
      confirmationCodeExpiresAt: Date.now() + 10 * 60 * 1000, // 10 мин
      lastConfirmationResend: Date.now(),
    })
    .write();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'malkotohuski@gmail.com',
      pass: 'ymnayjeocfmplvwb',
    },
  });

  const mailOptions = {
    from: 'malkotohuski@gmail.com',
    to: email,
    subject: 'New confirmation code',
    text: `Your new confirmation code is: ${newCode}`,
  };

  transporter.sendMail(mailOptions, error => {
    if (error) {
      console.error('Resend error:', error);
      return res
        .status(500)
        .json({error: 'Failed to resend confirmation code.'});
    }

    return res.status(200).json({
      message: 'New confirmation code sent.',
    });
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

  const newRoute = {
    ...route,
    id: Date.now(),
    ownerId: userId, // ✅ ownership
    createdAt: Date.now(),
    status: 'active',
  };

  router.db.get('routes').push(newRoute).write();

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

  const newSeekerRoute = {
    ...seeker,
    id: Date.now(),
    seekerId: userId, // ✅ ownership
    createdAt: Date.now(),
    status: 'active',
  };

  router.db.get('seekers').push(newSeekerRoute).write();

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

  const user = router.db.get('users').find({email}).value();

  if (!user) {
    return res.status(404).json({
      error: 'User not found.',
    });
  }

  if (user.isActive) {
    return res.status(400).json({
      error: 'Account already confirmed.',
    });
  }

  if (user.confirmationCode !== confirmationCode.toString()) {
    return res.status(400).json({
      error: 'Invalid confirmation code.',
    });
  }

  if (
    !user.confirmationCodeExpiresAt ||
    Date.now() > user.confirmationCodeExpiresAt
  ) {
    return res.status(400).json({
      error: 'Confirmation code expired.',
    });
  }

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

  return res.status(200).json({
    message: 'Account confirmed successfully.',
  });
});

// New endpoint to send a request to the "imala" server

server.post('/send-request-to-email', async (req, res) => {
  const {email, text, image} = req.body;

  console.log('Send Request to Email:', {email, text, image});

  try {
    const user = router.db.get('users').find({email}).value();

    if (!user) {
      console.error('User not found with email:', email);
      return res.status(404).json({error: 'User not found.'});
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'malkotohuski@gmail.com',
        pass: 'ymnayjeocfmplvwb',
      },
    });

    const mailOptions = {
      from: 'malkotohuski@gmail.com',
      to: email,
      subject: '🚨 New Report Received',
      text: `Hello ${user.username},\n\n${text}`,
      html: `
        <p>📛 <strong>New Report Received</strong></p>
        <p>${text.replace(/\n/g, '<br/>')}</p>
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
      console.log('Email sent:', info.response);
      return res.status(200).json({message: 'Email sent successfully.'});
    });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({error: 'Internal Server Error'});
  }
});

// New endpoint to handle route approval
// Updated endpoint to handle route request approval or rejection
server.post('/send-request-to-user', (req, res) => {
  const {requestingUser} = req.body;

  // Проверка дали е подаден потребител
  if (!requestingUser) {
    console.error('Requesting user is undefined');
    return res
      .status(400)
      .json({error: 'Invalid request. Requesting user is undefined.'});
  }

  // Проверка за наличен routeId
  if (!requestingUser.routeId) {
    console.error('Route ID is undefined in requestingUser');
    return res.status(400).json({
      error: 'Invalid request. Route ID is undefined in requestingUser.',
    });
  }

  // Проверка за наличен userID (идентификатор на кандидата)
  if (!requestingUser.userID) {
    console.error('User ID is undefined in requestingUser');
    return res.status(400).json({
      error: 'Invalid request. User ID is undefined in requestingUser.',
    });
  }

  // Проверка дали маршрута съществува
  const route = router.db
    .get('routes')
    .find({id: requestingUser.routeId})
    .value();

  if (!route) {
    console.error('Route not found');
    return res.status(404).json({error: 'Route not found.'});
  }

  // Проверка дали вече има заявка от този user за този маршрут
  const existingRequest = router.db
    .get('requests')
    .find({routeId: requestingUser.routeId, userID: requestingUser.userID})
    .value();

  if (existingRequest) {
    console.log('User has already requested this route');
    return res
      .status(400)
      .json({error: 'You have already submitted a request for this route.'});
  }

  // Създаване на нова заявка
  const newRequest = {
    ...requestingUser,
    id: Date.now(),
    rateCreator: false,
    rateUser: false,
  }; //ново 23/09

  // Запис в базата (requests)
  router.db.get('requests').push(newRequest).write();

  console.log('Request saved successfully');
  return res
    .status(200)
    .json({message: 'Route request processed successfully.'});
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

server.post('/rateUser', (req, res) => {
  const {userId, fromUserId, stars, comment} = req.body;

  if (!userId || !fromUserId || typeof stars !== 'number') {
    return res.status(400).json({error: 'Missing or invalid fields.'});
  }

  const user = router.db.get('users').find({id: userId}).value();
  if (!user) {
    return res.status(404).json({error: 'User not found.'});
  }

  // Забрана за повече от 1 оценка от един и същ потребител (можеш да я премахнеш ако искаш)
  const alreadyRated = user.ratings.find(r => r.fromUserId === fromUserId);
  if (alreadyRated) {
    return res.status(400).json({error: 'You have already rated this user.'});
  }

  const rating = {
    fromUserId,
    stars,
    comment: comment || '',
    date: new Date().toISOString(),
  };

  user.ratings.push(rating);

  // Изчисляване на средната стойност
  const totalStars = user.ratings.reduce((sum, r) => sum + r.stars, 0);
  const avg = totalStars / user.ratings.length;

  user.averageRating = parseFloat(avg.toFixed(1)); // например 4.5

  // Записване обратно в базата
  router.db.get('users').find({id: userId}).assign(user).write();

  res.status(200).json({
    message: 'Rating submitted successfully.',
    averageRating: user.averageRating,
  });
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
      user: 'malkotohuski@gmail.com',
      pass: 'ymnayjeocfmplvwb',
    },
  });

  transporter.sendMail(
    {
      from: 'malkotohuski@gmail.com',
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
