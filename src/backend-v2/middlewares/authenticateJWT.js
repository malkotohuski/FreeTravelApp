const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function authenticateJWT(req, res, next) {
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
    req.user = {
      id: decoded.userId,
      isAdmin: Boolean(decoded.isAdmin),
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({error: 'Token expired'});
    }

    return res.status(403).json({error: 'Invalid token'});
  }
};
