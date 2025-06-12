const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Middleware to ensure the user is authenticated via JWT in cookies
function ensureAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    const user = jwt.verify(token, secret);
    req.user = user; // Attach user info to request for downstream use
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.redirect('/login');
  }
}

module.exports = { ensureAuth };
