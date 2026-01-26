require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // взема таен ключ от .env

if (!JWT_SECRET) {
  console.error('⚠️ JWT_SECRET is not defined in .env!');
  process.exit(1); // спира сървъра ако няма ключ
}

function authenticateJWT(req, res, next) {
  // Токенът се очаква в header Authorization: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({error: 'Authorization header missing'});
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({error: 'Token missing'});
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // тук можем да вземаме user.id, username и т.н.
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(403).json({error: 'Invalid or expired token'});
  }
}

module.exports = authenticateJWT;
