const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_later';

module.exports = function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({error: 'Authorization header missing'});
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({error: 'Token missing'});
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // записваме userId в req.user
    next();
  } catch (err) {
    return res.status(403).json({error: 'Invalid or expired token'});
  }
};
