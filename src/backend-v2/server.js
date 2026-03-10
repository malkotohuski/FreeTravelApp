require('dotenv').config();
const express = require('express');
const cors = require('cors');

const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateJWT = require('./middlewares/authenticateJWT');
const multer = require('multer');

const http = require('http');
const {Server} = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
console.log(process.env.JWT_SECRET);
console.log(process.env.EMAIL_USER);
console.log(process.env.DATABASE_URL);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/test', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

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
    socket.join('user_' + userId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});

console.log(Object.keys(prisma));
