const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({error: 'Authorization header missing'});
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({error: 'Token missing'});
  }

  let decoded;

  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({error: 'Token expired'});
    }

    return res.status(403).json({error: 'Invalid token'});
  }

  if (!decoded.userId) {
    return res.status(403).json({error: 'Invalid token'});
  }

  try {
    const user = await prisma.user.findUnique({
      where: {id: decoded.userId},
      select: {id: true, isActive: true, accountStatus: true, isAdmin: true},
    });

    if (!user || !user.isActive || user.accountStatus !== 'active') {
      return res.status(401).json({error: 'Account is not active'});
    }

    req.user = {
      id: user.id,
      isAdmin: Boolean(user.isAdmin),
    };

    return next();
  } catch (err) {
    console.error('Auth user lookup error:', err);
    return res.status(500).json({error: 'Authentication failed'});
  }
};
