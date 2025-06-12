const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try {
    const user = jwt.verify(token, secret);
    req.user = user;
    next();
  } catch (err) {
    return res.redirect('/login');
  }
}

module.exports = { authenticate };