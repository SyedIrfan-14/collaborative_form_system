// const express = require('express');
// const path = require('path');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser');
// const db = require('../config/db');
// const router = express.Router();

// const secret = process.env.JWT_SECRET;

// // Middleware
// router.use(express.urlencoded({ extended: false }));
// router.use(cookieParser());

// // --- Authentication Middleware ---
// function ensureAuth(req, res, next) {
//   const token = req.cookies.token;
//   if (!token) return res.redirect('/login');
//   try {
//     req.user = jwt.verify(token, secret);
//     next();
//   } catch {
//     res.clearCookie('token');
//     res.redirect('/login');
//   }
// }

// // --- Register Page ---
// router.get('/register', (req, res) => res.render('register'));

// // --- Register Handler ---
// router.post('/register', async (req, res) => {
//   try {
//     const { username, dob, email, password } = req.body;
//     if (!username || !dob || !email || !password) {
//       return res.render('register', { error: 'All fields are required' });
//     }
//     const hash = await bcrypt.hash(password, 10);
//     await db.query(
//       'INSERT INTO Users (username, dob, email, password_hash) VALUES (?, ?, ?, ?)',
//       [username, dob, email, hash]
//     );
//     res.redirect('/login');
//   } catch (err) {
//     if (err.code === 'ER_DUP_ENTRY') {
//       return res.status(400).render('register', { error: 'Email already registered' });
//     }
//     res.status(500).render('register', { error: 'Server error' });
//   }
// });

// // --- Login Page ---
// router.get('/login', (req, res) => res.render('login'));

// // --- Login Handler ---
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
//     const user = users[0];
//     if (!user || !(await bcrypt.compare(password, user.password_hash))) {
//       return res.render('login', { error: 'Invalid credentials' });
//     }
//     const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
//     res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
//     res.redirect('/welcome');
//   } catch (err) {
//     res.status(500).render('login', { error: 'Server error' });
//   }
// });

// // --- Welcome Page ---
// router.get('/welcome', ensureAuth, async (req, res) => {
//   try {
//     const [users] = await db.query('SELECT username FROM Users WHERE id = ?', [req.user.id]);
//     if (!users[0]) return res.redirect('/login');
//     res.render('welcome', { username: users[0].username });
//   } catch (err) {
//     res.status(500).render('welcome', {
//       username: '',
//       error: 'Server error'
//     });
//   }
// });

// // --- Update Credentials Page ---
// router.get('/update-credentials', ensureAuth, async (req, res) => {
//   try {
//     const [users] = await db.query('SELECT username, dob, email FROM Users WHERE id = ?', [req.user.id]);
//     if (!users[0]) return res.redirect('/login');
//     res.render('update-credentials', {
//       user: users[0],
//       error: null,
//       success: null
//     });
//   } catch (err) {
//     res.status(500).render('update-credentials', {
//       user: {},
//       error: 'Server error',
//       success: null
//     });
//   }
// });

// // --- Update Handler ---
// router.post('/update-credentials', ensureAuth, async (req, res) => {
//   try {
//     const { username, dob, email, password } = req.body;
//     let query = 'UPDATE Users SET username = ?, dob = ?, email = ?';
//     const params = [username, dob, email];
//     if (password && password.trim() !== '') {
//       const hash = await bcrypt.hash(password, 10);
//       query += ', password_hash = ?';
//       params.push(hash);
//     }
//     query += ' WHERE id = ?';
//     params.push(req.user.id);

//     await db.query(query, params);

//     const [users] = await db.query('SELECT username, dob, email FROM Users WHERE id = ?', [req.user.id]);
//     res.render('update-credentials', {
//       user: users[0],
//       error: null,
//       success: 'Credentials updated successfully!'
//     });
//   } catch (err) {
//     res.status(500).render('update-credentials', {
//       user: req.body,
//       error: 'Server error',
//       success: null
//     });
//   }
// });

// // --- Logout ---
// router.get('/logout', (req, res) => {
//   res.clearCookie('token');
//   res.redirect('/login');
// });

// module.exports = router;


const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('../config/db');
const router = express.Router();

const secret = process.env.JWT_SECRET;

// Middleware
router.use(express.urlencoded({ extended: false }));
router.use(cookieParser());

// --- Authentication Middleware ---
function ensureAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (err) {
    res.clearCookie('token');
    res.redirect('/login');
  }
}

// --- Register Page ---
router.get('/register', (req, res) => res.render('register', { error: null }));

// --- Register Handler ---
router.post('/register', async (req, res) => {
  try {
    const { username, dob, email, password } = req.body;
    if (!username || !dob || !email || !password) {
      return res.render('register', { error: 'All fields are required' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO Users (username, dob, email, password_hash) VALUES (?, ?, ?, ?)',
      [username, dob, email, hash]
    );
    res.redirect('/login');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).render('register', { error: 'Email already registered' });
    }
    console.error('Register error:', err);
    res.status(500).render('register', { error: 'Server error' });
  }
});

// --- Login Page ---
router.get('/login', (req, res) => res.render('login', { error: null }));

// --- Login Handler ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.redirect('/welcome');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('login', { error: 'Server error' });
  }
});

// --- Welcome Page ---
router.get('/welcome', ensureAuth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT username FROM Users WHERE id = ?', [req.user.id]);
    if (!users[0]) return res.redirect('/login');
    res.render('welcome', { username: users[0].username, error: null });
  } catch (err) {
    console.error('Welcome error:', err);
    res.status(500).render('welcome', { username: '', error: 'Server error' });
  }
});

// --- Update Credentials Page ---
router.get('/update-credentials', ensureAuth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT username, dob, email FROM Users WHERE id = ?', [req.user.id]);
    if (!users[0]) return res.redirect('/login');
    res.render('update-credentials', {
      user: users[0],
      error: null,
      success: null,
      welcomeMessage: null
    });
  } catch (err) {
    console.error('Update credentials page error:', err);
    res.status(500).render('update-credentials', {
      user: {},
      error: 'Server error',
      success: null,
      welcomeMessage: null
    });
  }
});

// --- Update Handler ---
router.post('/update-credentials', ensureAuth, async (req, res) => {
  try {
    const { username, dob, email, password } = req.body;
    let query = 'UPDATE Users SET username = ?, dob = ?, email = ?';
    const params = [username, dob, email];
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(hash);
    }
    query += ' WHERE id = ?';
    params.push(req.user.id);

    await db.query(query, params);

    const [users] = await db.query('SELECT username, dob, email FROM Users WHERE id = ?', [req.user.id]);
    res.render('update-credentials', {
      user: users[0],
      error: null,
      success: 'Credentials updated successfully!',
      welcomeMessage: null
    });
  } catch (err) {
    console.error('Update credentials handler error:', err);
    res.status(500).render('update-credentials', {
      user: req.body,
      error: 'Server error',
      success: null,
      welcomeMessage: null
    });
  }
});

// --- Logout ---
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;



