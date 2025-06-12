const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const router = express.Router();

const secret = process.env.JWT_SECRET;

// Render registration page
router.get('/register', (req, res) => res.render('register'));

// Handle registration
router.post('/register',
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').notEmpty().withMessage('Username is required'),
  async (req, res) => {
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
      res.redirect('/login');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).render('register', { error: 'Email already registered' });
      }
      console.error('Registration error:', err);
      res.status(500).render('register', { error: 'Server error' });
    }
  }
);

// Render login page
router.get('/login', (req, res) => res.render('login'));

// Handle login
router.post('/login',
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password cannot be empty'),
  async (req, res) => {
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
      console.error('Login error:', err);
      res.status(500).render('login', { error: 'Server error' });
    }
  }
);

// Render update credentials page (protected, with welcome message)
router.get('/update-credentials', ensureAuth, async (req, res) => {
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
});

// Handle update credentials form submission (protected)
router.post('/update-credentials', ensureAuth,
  body('email').isEmail().withMessage('Invalid email address'),
  body('username').notEmpty().withMessage('Username cannot be empty'),
  async (req, res) => {
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
);

// Logout route
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
