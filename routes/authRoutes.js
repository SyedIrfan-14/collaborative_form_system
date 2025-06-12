const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, getUpdateCredentials, postUpdateCredentials, logout } = require('../controllers/authController');
const { ensureAuth } = require('../middleware/auth'); // middleware to protect routes

// Render registration page
router.get('/register', (req, res) => res.render('register'));

// Render login page
router.get('/login', (req, res) => res.render('login'));

// Handle registration form submission with validation
router.post('/register',
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  register
);

// Handle login form submission with validation
router.post('/login',
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password cannot be empty'),
  login
);

// Render update credentials page (protected)
router.get('/update-credentials', ensureAuth, getUpdateCredentials);

// Handle update credentials form submission (protected)
router.post('/update-credentials', ensureAuth,
  body('email').isEmail().withMessage('Invalid email address'),
  body('username').notEmpty().withMessage('Username cannot be empty'),
  postUpdateCredentials
);

// Logout route
router.get('/logout', logout);

module.exports = router;
