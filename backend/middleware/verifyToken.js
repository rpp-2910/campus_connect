// backend/middleware/verifyToken.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'No token — please log in' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role? }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token invalid or expired' });
  }
};

// Optional token extraction — attaches req.user if valid token provided, but doesn't reject if omitted
const optionalToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.optionalToken = optionalToken;