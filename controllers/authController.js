const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

async function register(req, res) {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO Users (email, password_hash) VALUES (?, ?)', [email, hash]);
  res.redirect('/login');
}

async function login(req, res) {
  const { email, password } = req.body;
  const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
  const user = users[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.send('Invalid credentials');
  }
  const token = jwt.sign({ id: user.id, role: user.role }, secret);
  res.cookie('token', token).redirect('/dashboard');
}

module.exports = { register, login };