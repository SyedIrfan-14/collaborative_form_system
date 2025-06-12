const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.get('/register', (req, res) => res.render('register'));
router.get('/login', (req, res) => res.render('login'));
router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  register
);
router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  login
);

module.exports = router;
