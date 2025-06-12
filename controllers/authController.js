const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

async function register(req, res) {
  try {
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO Users (email, password_hash) VALUES (?, ?)', [email, hash]);
    res.redirect('/login');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).render('register', { error: 'Email already registered' });
    }
    console.error('Registration error:', err);
    res.status(500).render('register', { error: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      // Render the login page with an error message
      return res.render('login', { error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' }).redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('login', { error: 'Server error' });
  }
}

module.exports = { register, login };
