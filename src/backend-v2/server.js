require('dotenv').config();
const express = require('express');
const cors = require('cors');

const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateJWT = require('./middlewares/authenticateJWT');

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

const reportRoutes = require('./routes/reportRoutes');
app.use('/api/report', reportRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api', notificationRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

console.log(Object.keys(prisma));
