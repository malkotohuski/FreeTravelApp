require('dotenv').config();

function internalOnly(req, res, next) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({error: 'Forbidden'});
  }
  next();
}

module.exports = internalOnly;
