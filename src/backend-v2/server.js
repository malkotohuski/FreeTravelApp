const onlineUsers = new Map();
const userCurrentChat = new Map();

global.userCurrentChat = userCurrentChat;

global.isUserInConversation = (userId, conversationId) => {
  return userCurrentChat.get(Number(userId)) === String(conversationId);
};

require('dotenv').config();

const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {setOnlineUsers} = require('./utils/onlineUsers');
setOnlineUsers(onlineUsers);

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const http = require('http');
const rateLimit = require('express-rate-limit');
const {Server} = require('socket.io');

const authenticateJWT = require('./middlewares/authenticateJWT');
const testRoutes = require('./routes/testRoutes');
const deviceTokenRouter = require('./routes/deviceToken');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

if (isProduction && allowedOrigins.length === 0) {
  throw new Error('CORS_ORIGINS is required in production');
}

const isOriginAllowed = origin => {
  return !origin || (!isProduction && allowedOrigins.length === 0) || allowedOrigins.includes(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
};

app.use(cors(corsOptions));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true, limit: '10mb'}));
app.set('trust proxy', 1);

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

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

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
    userId: req.user.id,
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
  return res.status(500).json({error: 'Server error'});
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  },
});

global.io = io;

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('joinUserRoom', userId => {
    const room = 'user_' + userId;

    socket.join(room);
    onlineUsers.set(Number(userId), socket.id);

    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });

  socket.on('joinConversation', ({userId, conversationId}) => {
    const room = 'conversation_' + conversationId;

    socket.join(room);
    userCurrentChat.set(Number(userId), String(conversationId));
  });

  socket.on('leaveConversation', ({userId, conversationId}) => {
    const room = 'conversation_' + conversationId;

    socket.leave(room);
    userCurrentChat.delete(Number(userId));
  });

  socket.on('messageDelivered', async ({conversationId, messageId, userId}) => {
    try {
      const parsedConversationId = Number(conversationId);
      const parsedMessageId = Number(messageId);
      const parsedUserId = Number(userId);

      if (!parsedConversationId || !parsedMessageId || !parsedUserId) {
        return;
      }

      const message = await prisma.message.findFirst({
        where: {
          id: parsedMessageId,
          conversationId: parsedConversationId,
          senderId: {not: parsedUserId},
        },
        include: {
          conversation: {
            select: {user1Id: true, user2Id: true},
          },
        },
      });

      if (
        !message ||
        ![message.conversation.user1Id, message.conversation.user2Id].includes(
          parsedUserId,
        )
      ) {
        return;
      }

      if (!message.deliveredAt) {
        await prisma.message.update({
          where: {id: parsedMessageId},
          data: {deliveredAt: new Date()},
        });
      }

      io.to('user_' + message.senderId).emit('messagesDelivered', {
        conversationId: parsedConversationId,
        messageId: parsedMessageId,
      });
    } catch (error) {
      console.error('messageDelivered socket error:', error);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
