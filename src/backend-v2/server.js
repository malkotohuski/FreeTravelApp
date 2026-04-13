const onlineUsers = new Map();
const userCurrentChat = new Map();

global.userCurrentChat = userCurrentChat;

global.isUserInConversation = (userId, conversationId) => {
  return userCurrentChat.get(Number(userId)) === String(conversationId);
};

const {setOnlineUsers} = require('./utils/onlineUsers');
setOnlineUsers(onlineUsers);
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateJWT = require('./middlewares/authenticateJWT');
const multer = require('multer');

const http = require('http');
const {Server} = require('socket.io');
const testRoutes = require('./routes/testRoutes');
const deviceTokenRouter = require('./routes/deviceToken');

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {error: 'Too many login attempts. Please try again later.'},
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {error: 'Too many refresh attempts. Please try again later.'},
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/refresh', refreshLimiter);

// ✅ СЛЕД ТОВА идват routes-ите
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
console.log(process.env.JWT_SECRET);
console.log(process.env.EMAIL_USER);
console.log(process.env.DATABASE_URL);

app.get('/test', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.use('/api', deviceTokenRouter);

app.use('/api/test', testRoutes);

const usersRoutes = require('./routes/usersRoutes');
app.use('/api/users', usersRoutes);

const commentRoutes = require('./routes/commentRoutes');
app.use('/api', commentRoutes);

const routeRoutes = require('./routes/routeRoutes');
app.use('/api/routes', routeRoutes);

const requestRoutes = require('./routes/requestRoutes');
app.use('/api', requestRoutes);

app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({
    message: 'You have access to this protected route!',
    userId: req.user.userId,
  });
});

const conversationRoutes = require('./routes/conversationRoutes');
app.use('/api/conversations', conversationRoutes);

const reportRoutes = require('./routes/reportRoutes');
app.use('/api', reportRoutes);

const bugReportRoutes = require('./routes/bugReportRoutes');
app.use('/api', bugReportRoutes);

const seekerRoutes = require('./routes/seekerRoutes');
app.use('/api', seekerRoutes);

const ratingRoutes = require('./routes/ratingRoutes');
app.use('/api/ratings', ratingRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api', notificationRoutes);

const cityRoutes = require('./routes/cityRoutes');
app.use('/api/cities', cityRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({error: err.message});
  }

  if (err.message === 'Only image files are allowed.') {
    return res.status(400).json({error: err.message});
  }

  console.error(err);
  res.status(500).json({error: 'Server error'});
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

global.io = io;

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('joinUserRoom', userId => {
    const room = 'user_' + userId;

    socket.join(room);

    // ✅ добавяме user в online map
    onlineUsers.set(Number(userId), socket.id);

    console.log(`User ${socket.id} joined room ${room}`);
    console.log('🟢 ONLINE USERS:', onlineUsers);

    socket.emit('joinedRoom', room);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // ✅ махаме user от online map
    for (let [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    console.log('🔴 ONLINE USERS:', onlineUsers);
  });

  // 👉 когато user отвори чат
  socket.on('joinConversation', ({userId, conversationId}) => {
    const room = 'conversation_' + conversationId;

    socket.join(room); // 💥 ДОБАВИ ТОВА

    userCurrentChat.set(Number(userId), String(conversationId));

    console.log('💬 USER IN CHAT:', userId, conversationId);
    console.log('📦 JOINED ROOM:', room);
  });

  // 👉 когато user излезе от чат
  socket.on('leaveConversation', ({userId, conversationId}) => {
    const room = 'conversation_' + conversationId;

    socket.leave(room); // 💥 ДОБАВИ ТОВА

    userCurrentChat.delete(Number(userId));

    console.log('🚪 USER LEFT CHAT:', userId);
    console.log('📦 LEFT ROOM:', room);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

console.log(Object.keys(prisma));
