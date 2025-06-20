const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const cors = require('cors');
const nodemailer = require('nodemailer');
const axios = require('axios');

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
server.post('/register', (req, res) => {
  deleteInactiveAccountsOlderThanOneDay();
  const {username, useremail, userpassword, fName, lName, userImage, routes} =
    req.body;

  console.log('Registration Request:', {
    username,
    useremail,
    userpassword,
    fName,
    lName,
    userImage,
    routes,
  });

  // Validation (you can add more checks as needed)
  if (!username || !useremail || !userpassword) {
    return res
      .status(400)
      .json({error: 'Invalid input. Please provide all required fields.'});
  }

  // Check if a user with the same email or name already exists
  // Проверка: има ли вече АКТИВЕН потребител с такъв email или username
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

  // Ако има неактивен акаунт със същия email или username, изтрий го
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

  // Simulate user creation (you may want to hash the password in a real scenario)
  const confirmationCode = generateConfirmationCode();
  const user = {
    id: Date.now(),
    username,
    email: useremail,
    password: userpassword,
    fName,
    lName,
    userImage,
    confirmationCode,
    isActive: false, // ново поле за статус
    createdAt: Date.now(),
    routes: [],
    friends: [],
    ratings: [],
    averageRating: 0,
    comments: [],
  };

  router.db.get('users').push(user).write();

  // Send confirmation email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'malkotohuski@gmail.com', // replace with your Gmail address
      pass: 'ymnayjeocfmplvwb', // replace with your Gmail password
    },
  });

  const mailOptions = {
    from: 'malkotohuski@gmail.com', // replace with your Gmail address
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
      return res.status(201).json({user, confirmationCode});
    }
  });
});

function deleteInactiveAccountsOlderThanOneDay() {
  const now = Date.now();
  const users = router.db.get('users').value();

  const activeUsers = users.filter(user => {
    if (!user.isActive && user.createdAt) {
      const age = now - user.createdAt;
      // 1 ден = 24 * 60 * 60 * 1000 = 86 400 000 милисекунди
      return age < 60000; // ще го запазим само ако е под 1 ден
    }
    return true; // всички активни остават
  });

  router.db.set('users', activeUsers).write();
  console.log('Inactive accounts older than 1 day have been deleted.');
}

server.post('/resend-confirmation-code', (req, res) => {
  const {email} = req.body;

  if (!email) {
    return res.status(400).json({error: 'Email is required.'});
  }

  const user = router.db.get('users').find({email}).value();

  if (!user || user.isActive) {
    return res
      .status(400)
      .json({error: 'No inactive user found with this email.'});
  }

  // Генерирай нов код
  const newCode = generateConfirmationCode();

  // Обнови кода и датата
  router.db
    .get('users')
    .find({email})
    .assign({
      confirmationCode: newCode,
      createdAt: Date.now(),
    })
    .write();

  // Изпрати имейла
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
    subject: 'Resent Confirmation Code',
    text: `Your new confirmation code is: ${newCode}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Resend error:', error);
      return res
        .status(500)
        .json({error: 'Failed to resend confirmation code.'});
    } else {
      console.log('Resend sent:', info.response);
      return res.status(200).json({message: 'New confirmation code sent.'});
    }
  });
});

server.patch('/user-changes', (req, res) => {
  const {userId, userImage} = req.body;

  console.log('User Changes Request:', {userId, userImage});

  // Валидация на userId
  if (!userId) {
    console.error('Invalid userId:', userId);
    return res.status(400).json({error: 'Invalid userId.'});
  }

  // Намери потребителя по userId в базата данни
  const user = router.db.get('users').find({id: userId}).value();

  if (!user) {
    console.error('User not found with userId:', userId);
    return res.status(404).json({error: 'User not found.'});
  }

  // Актуализирай профилната снимка на потребителя
  router.db.get('users').find({id: userId}).assign({userImage}).write();

  return res
    .status(200)
    .json({message: 'User profile picture updated successfully.'});
});

server.post('/create-route', (req, res) => {
  const {route} = req.body;

  // Add the new route to the "routes" array
  const newRoute = {...route, id: Date.now()};
  router.db.get('routes').push(newRoute).write();

  return res
    .status(201)
    .json({message: 'Route created successfully.', route: newRoute});
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
server.post('/verify-confirmation-code', (req, res) => {
  const {email, confirmationCode} = req.body;

  // Намери потребителя по имейл
  const user = router.db.get('users').find({email}).value();

  if (!user) {
    // Потребителят не е намерен
    return res.status(404).json({error: 'User not found.'});
  }

  // Провери дали съвпада confirmationCode
  if (user.confirmationCode === parseInt(confirmationCode, 10)) {
    // Обнови статус на потребителя на активен
    router.db
      .get('users')
      .find({email})
      .assign({isActive: true, confirmationCode: null})
      .write();

    return res
      .status(200)
      .json({message: 'Confirmation code verified successfully.'});
  } else {
    return res.status(400).json({error: 'Invalid confirmation code.'});
  }
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
  const newRequest = {...requestingUser, id: Date.now()};

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
server.post('/login', (req, res) => {
  const {useremail, userpassword} = req.body;

  // Намираме потребителя по email и password (препоръчително е паролите да бъдат хеширани)
  const user = router.db
    .get('users')
    .find({email: useremail, password: userpassword})
    .value();
  console.log('sss', user);

  if (user) {
    // Проверка дали потребителят е потвърден
    if (user.confirmationCode) {
      // Ако confirmationCode не е null, отказва достъп
      return res.status(403).json({
        error: 'Account not confirmed. Please verify your account first.',
      });
    }

    // Успешен логин
    return res.status(200).json({user});
  } else {
    // Грешка при логин
    return res.status(401).json({error: 'Invalid email or password'});
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

// Use default router
server.use(router);

const port = process.env.PORT || 3000;
const host = '0.0.0.0';
server.listen(port, host, () => {
  console.log(`JSON Server is running on http://${host}:${port}`);
});

/* app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
}); */
