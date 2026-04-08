const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_later';

module.exports = function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({error: 'Authorization header missing'});

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({error: 'Token missing'});

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {id: decoded.userId};
    next();
  } catch (err) {
    // ✅ Раздели грешките
    console.log('JWT ERROR NAME:', err.name);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({error: 'Token expired'}); // interceptor-ът ще го хване
    }
    return res.status(403).json({error: 'Invalid token'}); // наистина невалиден токен
  }
};
