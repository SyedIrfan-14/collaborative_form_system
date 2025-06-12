const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('./config/db'); // adjust as needed
const app = express();

const secret = process.env.JWT_SECRET;

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to check authentication
function ensureAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.clearCookie('token');
    res.redirect('/login');
  }
}

// Register page
app.get('/register', (req, res) => res.render('register'));

// Register handler
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.render('register', { error: 'All fields are required' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hash]
    );
    res.redirect('/login'); // Go to login page after registration
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).render('register', { error: 'Email already registered' });
    }
    res.status(500).render('register', { error: 'Server error' });
  }
});

// Login page
app.get('/login', (req, res) => res.render('login'));

// Login handler
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.redirect('/update-credentials');
  } catch (err) {
    res.status(500).render('login', { error: 'Server error' });
  }
});

// Update credentials page (shows welcome message after login)
app.get('/update-credentials', ensureAuth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT username, email FROM Users WHERE id = ?',
      [req.user.id]
    );
    if (!users[0]) return res.redirect('/login');
    res.render('update-credentials', {
      user: users[0],
      error: null,
      success: null,
      welcomeMessage: `Welcome, ${users[0].username}!`
    });
  } catch (err) {
    res.status(500).render('update-credentials', {
      user: {},
      error: 'Server error',
      success: null,
      welcomeMessage: null
    });
  }
});

// Update credentials handler (shows success message)
app.post('/update-credentials', ensureAuth, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let query = 'UPDATE Users SET username = ?, email = ?';
    const params = [username, email];
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(hash);
    }
    query += ' WHERE id = ?';
    params.push(req.user.id);

    await db.query(query, params);

    const [users] = await db.query('SELECT username, email FROM Users WHERE id = ?', [req.user.id]);
    res.render('update-credentials', {
      user: users[0],
      error: null,
      success: 'Credentials updated successfully!',
      welcomeMessage: `Welcome, ${users[0].username}!`
    });
  } catch (err) {
    res.status(500).render('update-credentials', {
      user: req.body,
      error: 'Server error',
      success: null,
      welcomeMessage: null
    });
  }
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// Serve static files and start server as needed...
