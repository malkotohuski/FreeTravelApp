require('dotenv').config();
const express = require('express');
const cors = require('cors');

const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateJWT = require('./middlewares/authenticateJWT');

const app = express();
app.use(cors());
app.use(express.json());

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

app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({
    message: 'You have access to this protected route!',
    userId: req.user.userId,
  });
});

const reportRoutes = require('./routes/reportRoutes');
app.use('/api/report', reportRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

console.log(Object.keys(prisma));
