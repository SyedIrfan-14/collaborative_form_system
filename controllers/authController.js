const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Registration controller
async function register(req, res) {
  try {
    const { email, password, username } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO Users (email, password_hash, username) VALUES (?, ?, ?)', [email, hash, username]);
    res.redirect('/login');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).render('register', { error: 'Email already registered' });
    }
    console.error('Registration error:', err);
    res.status(500).render('register', { error: 'Server error' });
  }
}

// Login controller
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.redirect('/update-credentials');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('login', { error: 'Server error' });
  }
}

// Render update credentials page (GET)
async function getUpdateCredentials(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    const decoded = jwt.verify(token, secret);
    const [users] = await db.query('SELECT username, email FROM Users WHERE id = ?', [decoded.id]);
    if (!users[0]) return res.redirect('/login');
    res.render('update-credentials', { 
      user: users[0], 
      error: null, 
      success: null,
      welcomeMessage: `Welcome, ${users[0].username}!`
    });
  } catch (err) {
    console.error('Get update credentials error:', err);
    res.status(500).render('update-credentials', { user: {}, error: 'Server error', success: null, welcomeMessage: null });
  }
}

// Handle update credentials form submission (POST)
async function postUpdateCredentials(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    const decoded = jwt.verify(token, secret);
    const { username, email, password } = req.body;

    let query = 'UPDATE Users SET username = ?, email = ?';
    const params = [username, email];
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(hash);
    }
    query += ' WHERE id = ?';
    params.push(decoded.id);

    await db.query(query, params);

    const [users] = await db.query('SELECT username, email FROM Users WHERE id = ?', [decoded.id]);
    res.render('update-credentials', { 
      user: users[0], 
      error: null, 
      success: 'Credentials updated successfully!',
      welcomeMessage: `Welcome, ${users[0].username}!`
    });
  } catch (err) {
    console.error('Update credentials error:', err);
    res.status(500).render('update-credentials', { user: req.body, error: 'Server error', success: null, welcomeMessage: null });
  }
}

// Logout controller
function logout(req, res) {
  res.clearCookie('token');
  res.redirect('/login');
}

module.exports = {
  register,
  login,
  getUpdateCredentials,
  postUpdateCredentials,
  logout
};
